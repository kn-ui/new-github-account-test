import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';

interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'other';
  externalLink?: string;
  file?: {
    id: string;
    url: string;
    fileName: string;
  };
  courseId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CourseMaterialCreateData {
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'other';
  externalLink?: string;
  fileId?: string; // Asset ID from file upload
  courseId: string;
}

class CourseMaterialService {

  /**
   * Create course material
   */
  async createCourseMaterial(data: CourseMaterialCreateData): Promise<CourseMaterial> {
    try {
      const mutation = gql`
        mutation CreateCourseMaterial(
          $title: String!
          $description: String!
          $type: String!
          $externalLink: String
          $fileId: ID
          $courseId: ID!
        ) {
          createCourseMaterial(data: {
            title: $title
            description: $description
            type: $type
            externalLink: $externalLink
            file: ${data.fileId ? '{ connect: { id: $fileId } }' : 'null'}
            course: { connect: { id: $courseId } }
            isActive: true
          }) {
            id
            title
            description
            type
            externalLink
            file { id url fileName }
            course { id title }
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      const variables: any = {
        title: data.title,
        description: data.description,
        type: data.type,
        externalLink: data.externalLink || null,
        courseId: data.courseId
      };

      if (data.fileId) {
        variables.fileId = data.fileId;
      }

      const response = await hygraphClient.request<{ createCourseMaterial: any }>(mutation, variables);

      return this.transformCourseMaterial(response.createCourseMaterial);
    } catch (error) {
      console.error('Error creating course material:', error);
      throw new Error('Failed to create course material');
    }
  }

  /**
   * Get course material by ID
   */
  async getCourseMaterialById(materialId: string): Promise<CourseMaterial | null> {
    try {
      const query = gql`
        query GetCourseMaterial($id: ID!) {
          courseMaterial(where: { id: $id }) {
            id
            title
            description
            type
            externalLink
            file { id url fileName }
            course { id title }
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ courseMaterial: any | null }>(query, { id: materialId });
      
      if (!response.courseMaterial) return null;
      
      return this.transformCourseMaterial(response.courseMaterial);
    } catch (error) {
      console.error('Error getting course material:', error);
      throw new Error('Failed to get course material');
    }
  }

  /**
   * Get course materials by course with pagination
   */
  async getCourseMaterialsByCourse(
    courseId: string,
    page = 1,
    limit = 20,
    type?: string,
    activeOnly = true
  ): Promise<{
    materials: CourseMaterial[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause
      const whereConditions = [`course: { id: "${courseId}" }`];
      if (activeOnly) whereConditions.push('isActive: true');
      if (type) whereConditions.push(`type: "${type}"`);
      
      const whereClause = `where: { ${whereConditions.join(', ')} }`;

      const query = gql`
        query GetCourseMaterialsByCourse($first: Int!, $skip: Int!) {
          courseMaterialsConnection(${whereClause}, first: $first, skip: $skip, orderBy: createdAt_DESC) {
            aggregate { count }
            edges {
              node {
                id
                title
                description
                type
                externalLink
                file { id url fileName }
                course { id title }
                isActive
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        courseMaterialsConnection: {
          edges: { node: any }[];
          aggregate: { count: number };
        };
      }>(query, { first: limit, skip });

      const materials = response.courseMaterialsConnection.edges.map(edge => 
        this.transformCourseMaterial(edge.node)
      );
      const total = response.courseMaterialsConnection.aggregate.count;

      return {
        materials,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting course materials by course:', error);
      throw new Error('Failed to get course materials');
    }
  }

  /**
   * Update course material
   */
  async updateCourseMaterial(
    materialId: string,
    updateData: Partial<CourseMaterialCreateData>
  ): Promise<CourseMaterial> {
    try {
      const mutation = gql`
        mutation UpdateCourseMaterial($id: ID!, $data: CourseMaterialUpdateInput!) {
          updateCourseMaterial(where: { id: $id }, data: $data) {
            id
            title
            description
            type
            externalLink
            file { id url fileName }
            course { id title }
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      // Filter out undefined values and format data
      const data: Record<string, any> = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'fileId') {
            data.file = value ? { connect: { id: value } } : { disconnect: true };
          } else if (key !== 'courseId') {
            data[key] = value;
          }
        }
      });

      const response = await hygraphClient.request<{ updateCourseMaterial: any }>(mutation, {
        id: materialId,
        data
      });

      return this.transformCourseMaterial(response.updateCourseMaterial);
    } catch (error) {
      console.error('Error updating course material:', error);
      throw new Error('Failed to update course material');
    }
  }

  /**
   * Delete course material (soft delete)
   */
  async deleteCourseMaterial(materialId: string): Promise<void> {
    try {
      const mutation = gql`
        mutation DeleteCourseMaterial($id: ID!) {
          updateCourseMaterial(where: { id: $id }, data: { isActive: false }) {
            id
          }
        }
      `;

      await hygraphClient.request(mutation, { id: materialId });
    } catch (error) {
      console.error('Error deleting course material:', error);
      throw new Error('Failed to delete course material');
    }
  }

  /**
   * Transform course material data from Hygraph
   */
  private transformCourseMaterial(material: any): CourseMaterial {
    return {
      id: material.id,
      title: material.title,
      description: material.description,
      type: material.type,
      externalLink: material.externalLink,
      file: material.file ? {
        id: material.file.id,
        url: material.file.url,
        fileName: material.file.fileName
      } : undefined,
      courseId: material.course?.id || '',
      isActive: material.isActive,
      createdAt: new Date(material.createdAt),
      updatedAt: new Date(material.updatedAt)
    };
  }
}

export default new CourseMaterialService();