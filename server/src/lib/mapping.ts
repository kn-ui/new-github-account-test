/*
  Mapping utilities to transform Firestore user documents into Hygraph AppUserCreateInput.
  - Enum normalization with case-insensitive mapping tables
  - Fallback to "Other" + <field>Custom when unmapped
  - Relationship placeholders (courses etc.) are logged for follow-up
*/

import { AppUserCreateInput } from './hygraph';

// Canonical enums as strings expected by Hygraph schema
const ROLE_ENUM = ['student', 'teacher', 'admin', 'super_admin'] as const;
const DELIVERY_ENUM = ['Online', 'InPerson', 'Hybrid', 'Other'] as const;
const GROUP_ENUM = ['A', 'B', 'C', 'Other'] as const; // example
const PROGRAM_ENUM = ['Regular', 'Intensive', 'Summer', 'Other'] as const;

type Role = typeof ROLE_ENUM[number];

type Normalized<T extends readonly string[]> = T[number];

function normalizeEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  options?: { otherLabel?: string; setCustom?: (original: string) => void }
): Normalized<T> {
  const otherLabel = options?.otherLabel || 'Other';
  if (typeof value !== 'string') return otherLabel as Normalized<T>;
  const trimmed = value.trim();
  const match = allowed.find((a) => a.toLowerCase() === trimmed.toLowerCase());
  if (match) return match as Normalized<T>;
  options?.setCustom?.(trimmed);
  return otherLabel as Normalized<T>;
}

export interface FirestoreUserLike {
  uid?: string;
  id?: string;
  email?: string;
  displayName?: string;
  role?: string;
  isActive?: boolean;
  passwordChanged?: boolean;
  deliveryMethod?: string;
  studentGroup?: string;
  programType?: string;
  createdAt?: Date | string | number;
  updatedAt?: Date | string | number;
  // relationships that may require a second pass
  courseIds?: string[];
}

export function mapFirestoreUserToHygraph(input: FirestoreUserLike): AppUserCreateInput {
  const uid = input.uid || input.id;
  if (!uid) throw new Error('Missing uid/id in Firestore user');

  // Role normalization with custom fallback
  let roleCustom: string | null = null;
  const role = normalizeEnum(
    input.role ?? 'student',
    ROLE_ENUM,
    { otherLabel: 'student', setCustom: (orig) => (roleCustom = orig) }
  ) as Role;

  let deliveryMethodCustom: string | null = null;
  const deliveryMethod = input.deliveryMethod
    ? normalizeEnum(input.deliveryMethod, DELIVERY_ENUM, {
        otherLabel: 'Other',
        setCustom: (orig) => (deliveryMethodCustom = orig),
      })
    : undefined;

  let studentGroupCustom: string | null = null;
  const studentGroup = input.studentGroup
    ? normalizeEnum(input.studentGroup, GROUP_ENUM, {
        otherLabel: 'Other',
        setCustom: (orig) => (studentGroupCustom = orig),
      })
    : undefined;

  let programTypeCustom: string | null = null;
  const programType = input.programType
    ? normalizeEnum(input.programType, PROGRAM_ENUM, {
        otherLabel: 'Other',
        setCustom: (orig) => (programTypeCustom = orig),
      })
    : undefined;

  const payload: AppUserCreateInput = {
    uid,
    email: input.email || '',
    displayName: input.displayName || '',
    role,
    isActive: input.isActive ?? true,
    passwordChanged: input.passwordChanged ?? false,
    ...(deliveryMethod !== undefined && { deliveryMethod }),
    ...(deliveryMethodCustom !== null && { deliveryMethodCustom }),
    ...(studentGroup !== undefined && { studentGroup }),
    ...(studentGroupCustom !== null && { studentGroupCustom }),
    ...(programType !== undefined && { programType }),
    ...(programTypeCustom !== null && { programTypeCustom }),
    ...(roleCustom !== null && { roleCustom }),
  };

  return payload;
}

export function isoDate(input?: Date | string | number): string | undefined {
  if (!input) return undefined;
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function logUnmappedRelationship(kind: string, value: unknown): void {
  // This intentionally logs for follow-up mapping passes
  console.warn(`Unmapped relationship ${kind}:`, value);
}
