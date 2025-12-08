import React, { useState } from 'react';
import { BookOpen, Users, Clock, Heart, Scroll, Church, User, GraduationCap } from 'lucide-react';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import { Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';


const Academic: React.FC = () => {
    const { t } = useI18n();
  
  const departments = [
    {
      id: 1,
      name: `${t('academic.offerings.year1.course1.0') }`,
      icon: BookOpen,
      contactHr: `${t('academic.offerings.year1.course1.1')}`,
      credits: `${t('academic.offerings.year1.course1.2')}`,
      degree: `${t('academic.offerings.year1.course1.3')}`,
      
    },
    {
      id: 2,
      name: `${t('academic.offerings.year1.course2.0')}`,
      icon: Scroll,
      contactHr: `${t('academic.offerings.year1.course2.1')}`,
      credits: `${t('academic.offerings.year1.course2.2')}`,
      degree: `${t('academic.offerings.year1.course2.3')}`,
    },
    {
      id: 3,
      name: `${t('academic.offerings.year1.course3.0')}`,
      icon: Clock,
      contactHr: `${t('academic.offerings.year1.course3.1')}`,
      credits: `${t('academic.offerings.year1.course3.2')}`,
      degree: `${t('academic.offerings.year1.course3.3')}`,

    },
    {
      id: 4,
      name: `${t('academic.offerings.year1.course4.0')}`,
      icon: Heart,
      contactHr: `${t('academic.offerings.year1.course4.1')}`,
      credits: `${t('academic.offerings.year1.course4.2')}`,
      degree: `${t('academic.offerings.year1.course4.3')}`,

    },
    {
      id: 5,
      name: `${t('academic.offerings.year1.course5.0')}`,
      icon: Users,
      contactHr: `${t('academic.offerings.year1.course5.1')}`,
      credits: `${t('academic.offerings.year1.course5.2')}`,
      degree: `${t('academic.offerings.year1.course5.3')}`,

    }
  ];

  const departmentsThird = [
    {
      id: 1,
      name: `${t('academic.offerings.year3.course1.0')}`,
      icon: BookOpen,
      contactHr: `${t('academic.offerings.year3.course1.1')}`,
      credits: `${t('academic.offerings.year3.course1.2')}`,
      degree: `${t('academic.offerings.year3.course1.3')}`,

    },
    {
      id: 2,
      name: `${t('academic.offerings.year3.course2.0')}`,
      icon: Scroll,
      contactHr: `${t('academic.offerings.year3.course2.1')}`,
      credits: `${t('academic.offerings.year3.course2.2')}`,
      degree: `${t('academic.offerings.year3.course2.3')}`,
    },
    {
      id: 3,
      name: `${t('academic.offerings.year3.course3.0')}`,
      icon: Clock,
      contactHr: `${t('academic.offerings.year3.course3.1')}`,
      credits: `${t('academic.offerings.year3.course3.2')}`,
      degree: `${t('academic.offerings.year3.course3.3')}`,

    },
    {
      id: 4,
      name: `${t('academic.offerings.year3.course4.0')}`,
      icon: Heart,
      contactHr: `${t('academic.offerings.year3.course4.1')}`,
      credits: `${t('academic.offerings.year3.course4.2')}`,
      degree: `${t('academic.offerings.year3.course4.3')}`,

    },
    {
      id: 5,
      name: `${t('academic.offerings.year3.course5.0')}`,
      icon: Users,
      contactHr: `${t('academic.offerings.year3.course5.1')}`,
      credits: `${t('academic.offerings.year3.course5.2')}`,
      degree: `${t('academic.offerings.year3.course5.3')}`,

    },
    {
      id: 6,
      name: `${t('academic.offerings.year3.course6.0')}`,
      icon: Users,
      contactHr: `${t('academic.offerings.year3.course6.1')}`,
      credits: `${t('academic.offerings.year3.course6.2')}`,
      degree: `${t('academic.offerings.year3.course6.3')}`,

    },
    {
      id: 7,
      name: `${t('academic.offerings.year3.course7.0')}`,
      icon: Users,
      contactHr: `${t('academic.offerings.year3.course7.1')}`,
      credits: `${t('academic.offerings.year3.course7.2')}`,
      degree: `${t('academic.offerings.year3.course7.3')}`,

    }
  ];


  const departmentsSecondary = [
    {
      id: 1,
      name: `${t('academic.offerings.year2.course1.0')}`,
      icon: BookOpen,
      contactHr: `${t('academic.offerings.year2.course1.1')}`,
      credits: `${t('academic.offerings.year2.course1.2')}`,
      degree: `${t('academic.offerings.year2.course1.3')}`,

    },
    {
      id: 2,
      name: `${t('academic.offerings.year2.course2.0')}`,
      icon: Scroll,
      contactHr: `${t('academic.offerings.year2.course2.1')}`,
      credits: `${t('academic.offerings.year2.course2.2')}`,
      degree: `${t('academic.offerings.year2.course2.3')}`,
    },
    {
      id: 3,
      name: `${t('academic.offerings.year2.course3.0')}`,
      icon: Clock,
      contactHr: `${t('academic.offerings.year2.course3.1')}`,
      credits: `${t('academic.offerings.year2.course3.2')}`,
      degree: `${t('academic.offerings.year2.course3.3')}`,

    },
    {
      id: 4,
      name: `${t('academic.offerings.year2.course4.0')}`,
      icon: Heart,
      contactHr: `${t('academic.offerings.year2.course4.1')}`,
      credits: `${t('academic.offerings.year2.course4.2')}`,
      degree: `${t('academic.offerings.year2.course4.3')}`,

    },
    {
      id: 5,
      name: `${t('academic.offerings.year2.course5.0')}`,
      icon: Users,
      contactHr: `${t('academic.offerings.year2.course5.1')}`,
      credits: `${t('academic.offerings.year2.course5.2')}`,
      degree: `${t('academic.offerings.year2.course5.3')}`,

    },
    {
      id: 6,
      name: `${t('academic.offerings.year2.course6.0')}`,
      icon: Users,
      contactHr: `${t('academic.offerings.year2.course6.1')}`,
      credits: `${t('academic.offerings.year2.course6.2')}`,
      degree: `${t('academic.offerings.year2.course6.3')}`,

    }
  ];

  const departmentsFourth = [
    {
      id: 1,
      name: `${t('academic.offerings.year4.course1.0')}`,
      icon: BookOpen,
      contactHr: `${t('academic.offerings.year4.course1.1')}`,
      credits: `${t('academic.offerings.year4.course1.2')}`,
      degree: `${t('academic.offerings.year4.course1.3')}`,

    },
    {
      id: 2,
      name: `${t('academic.offerings.year4.course2.0')}`,
      icon: Scroll,
      contactHr: `${t('academic.offerings.year4.course2.1')}`,
      credits: `${t('academic.offerings.year4.course2.2')}`,
      degree: `${t('academic.offerings.year4.course2.3')}`,
    },
    {
      id: 3,
      name: `${t('academic.offerings.year4.course3.0')}`,
      icon: Clock,
      contactHr: `${t('academic.offerings.year4.course3.1')}`,
      credits: `${t('academic.offerings.year4.course3.2')}`,
      degree: `${t('academic.offerings.year4.course3.3')}`,

    },
    {
      id: 4,
      name: `${t('academic.offerings.year4.course4.0')}`,
      icon: Heart,
      contactHr: `${t('academic.offerings.year4.course4.1')}`,
      credits: `${t('academic.offerings.year4.course4.2')}`,
      degree: `${t('academic.offerings.year4.course4.3')}`,

    },
    {
      id: 5,
      name: `${t('academic.offerings.year4.course5.0')}`,
      icon: Users,
      contactHr: `${t('academic.offerings.year4.course5.1')}`,
      credits: `${t('academic.offerings.year4.course5.2')}`,
      degree: `${t('academic.offerings.year4.course5.3')}`,

    },
    {
      id: 6,
      name: `${t('academic.offerings.year4.course6.0')}`,
      icon: Users,
      contactHr: `${t('academic.offerings.year4.course6.1')}`,
      credits: `${t('academic.offerings.year4.course6.2')}`,
      degree: `${t('academic.offerings.year4.course6.3')}`,

    }
  ];

  // instead of a single boolean
  const [openDept, setOpenDept] = useState<number | null>(null);
  const deptKey1 = 1;
const deptKey2 = 2;
const deptKey3 = 3;
  const deptKey4 = 4;
  return (
    <div>
      <Header />
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        {/* Background Image */}
        <img
          src="/assets/background-img.png"
          alt="background"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />

        {/* Overlay for gradient and content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('academic.hero.title')}</h1>
            <p className="text-xl mb-8">
              {t('academic.hero.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Departments Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('academic.subhero.title')}</h2>
          <p className="text-lg text-gray-600">
            {t('academic.subhero.subtitle')}
          </p>
        </div>
        <div className="space-y-6 cursor-pointer">
         
               
                   
              <div key={deptKey1} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow" 
                            onClick={() => setOpenDept(openDept === deptKey1 ? null : deptKey1)}
              >  <div className="flex items-start justify-center"> <div className='flex space-x-4'> <div className="bg-blue-100 p-3 rounded-lg ">
                      <BookOpen className="w-6 h-6 text-blue-600" />
            </div>  <h3 className="text-xl font-semibold text-gray-900 mb-2 ">First (Year 1)</h3></div> {openDept === deptKey1 && (
                    <div className="flex-1 mt-11 "> 
                    <div className="">
             
                  
                      {departments.map((dept) => {
                        return (
                    
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-3 mb-6">
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Program Details</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Course:</span>
                                  <span className="font-medium">{dept.name}</span>
                                </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Contact Hr:</span>
                                <span className="font-medium">{dept.contactHr}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Credits:</span>
                                <span className="font-medium">{dept.credits}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Prerequisites:</span>
                                <span className="font-medium">{dept.degree}</span>
                              </div>
                            </div>
                          </div>

                      
                          
                        </div>
                        )
                      })}
                    </div>
                        
                      </div>
                 
                )} </div>
              </div>

          <div key={deptKey2} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            onClick={() => setOpenDept(openDept === deptKey2 ? null : deptKey2)}
          >  <div className="flex items-start justify-center"> <div className='flex space-x-4'> <div className="bg-blue-100 p-3 rounded-lg ">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>  <h3 className="text-xl font-semibold text-gray-900 mb-2 ">Second (Year 2)</h3></div> {openDept === deptKey2 && (
            <div className="flex-1 mt-11 ">
              <div className="">


                {departmentsSecondary.map((dept) => {
                  return (

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-3 mb-6">

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Program Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Course:</span>
                            <span className="font-medium">{dept.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Contact Hr:</span>
                            <span className="font-medium">{dept.contactHr}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Credits:</span>
                            <span className="font-medium">{dept.credits}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Prerequisites:</span>
                            <span className="font-medium">{dept.degree}</span>
                          </div>
                        </div>
                      </div>



                    </div>
                  )
                })}
              </div>

            </div>

          )} </div>
          </div>


          <div key={deptKey3} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            onClick={() => setOpenDept(openDept === deptKey3 ? null : deptKey3)}
          >  <div className="flex items-start justify-center"> <div className='flex space-x-4'> <div className="bg-blue-100 p-3 rounded-lg ">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>  <h3 className="text-xl font-semibold text-gray-900 mb-2 ">Third (Year 3)</h3></div> {openDept === deptKey3 && (
            <div className="flex-1 mt-11 ">
              <div className="">


                {departmentsThird.map((dept) => {
                  return (

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-3 mb-6">

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Program Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Course:</span>
                            <span className="font-medium">{dept.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Contact Hr:</span>
                            <span className="font-medium">{dept.contactHr}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Credits:</span>
                            <span className="font-medium">{dept.credits}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Prerequisites:</span>
                            <span className="font-medium">{dept.degree}</span>
                          </div>
                        </div>
                      </div>



                    </div>
                  )
                })}
              </div>

            </div>

          )} </div>
          </div>


          <div key={deptKey4} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            onClick={() => setOpenDept(openDept === deptKey4 ? null : deptKey4)}
          >  <div className="flex items-start justify-center"> <div className='flex space-x-4'> <div className="bg-blue-100 p-3 rounded-lg ">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>  <h3 className="text-xl font-semibold text-gray-900 mb-2 ">Fourth (Year 4)</h3></div> {openDept === deptKey4 && (
            <div className="flex-1 mt-11 ">
              <div className="">


                {departmentsFourth.map((dept) => {
                  return (

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-3 mb-6">

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Program Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Course:</span>
                            <span className="font-medium">{dept.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Contact Hr:</span>
                            <span className="font-medium">{dept.contactHr}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Credits:</span>
                            <span className="font-medium">{dept.credits}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Prerequisites:</span>
                            <span className="font-medium">{dept.degree}</span>
                          </div>
                        </div>
                      </div>



                    </div>
                  )
                })}
              </div>

            </div>

          )} </div>
          </div>
            
        </div>

      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('academic.cta.title')}</h2>
          <p className="text-xl mb-8">
            {t('academic.cta.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
              <Link to="/contact">{t('academic.cta.applyButton')}</Link>
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />

    </div>
  );
};

export default Academic;