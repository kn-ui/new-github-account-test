import { ReactNode, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import {
	SidebarProvider,
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from '@/components/ui/sidebar';

type Role = 'super_admin' | 'admin' | 'teacher' | 'student' | string | undefined;

export default function DashboardLayout({ children, userRole }: { children: ReactNode; userRole?: Role }) {
	const location = useLocation();

	const menuItems = useMemo(() => {
		switch (userRole) {
			case 'super_admin':
				return [
					{ label: 'Overview', to: '/dashboard' },
					{ label: 'Users', to: '/dashboard/users' },
					{ label: 'Courses', to: '/dashboard/courses' },
					{ label: 'Events', to: '/dashboard/events' },
					{ label: 'Reports', to: '/dashboard/reports' },
					{ label: 'Settings', to: '/dashboard/settings' },
				];
			case 'admin':
				return [
					{ label: 'Overview', to: '/dashboard' },
					{ label: 'Users', to: '/dashboard/users' },
					{ label: 'Courses', to: '/dashboard/courses' },
					{ label: 'Events', to: '/dashboard/events' },
					{ label: 'Reports', to: '/dashboard/reports' },
					{ label: 'Settings', to: '/dashboard/settings' },
				];
			case 'teacher':
				return [
					{ label: 'Overview', to: '/dashboard' },
					{ label: 'Students', to: '/dashboard/students' },
					{ label: 'Assignments', to: '/dashboard/assignments' },
					{ label: 'Submissions', to: '/dashboard/submissions' },
					{ label: 'Announcements', to: '/dashboard/announcements' },
					{ label: 'Materials', to: '/dashboard/materials' },
					{ label: 'My Courses', to: '/dashboard/my-courses' },
					{ label: 'Reports', to: '/dashboard/teacher-reports' },
					{ label: 'Analytics', to: '/dashboard/teacher-analytics' },
				];
			case 'student':
				return [
					{ label: 'Overview', to: '/dashboard' },
					{ label: 'My Courses', to: '/dashboard/student-courses' },
					{ label: 'Assignments', to: '/dashboard/student-assignments' },
					{ label: 'Submissions', to: '/dashboard/student-submissions' },
					{ label: 'Announcements', to: '/dashboard/student-announcements' },
					{ label: 'Exams', to: '/dashboard/student-exams' },
					{ label: 'Progress', to: '/dashboard/progress' },
					{ label: 'Grades', to: '/dashboard/student-grades' },
					{ label: 'Certificates', to: '/dashboard/certificates' },
				];
			default:
				return [{ label: 'Overview', to: '/dashboard' }];
		}
	}, [userRole]);

	return (
		<SidebarProvider>
			<Sidebar collapsible="icon" side="left" variant="sidebar">
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Dashboard</SidebarGroupLabel>
						<SidebarMenu>
							{menuItems.map((item) => (
								<SidebarMenuItem key={item.to}>
									<SidebarMenuButton asChild isActive={location.pathname === item.to}>
										<Link to={item.to}>{item.label}</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
					<SidebarSeparator />
				</SidebarContent>
			</Sidebar>
			<SidebarInset>
				<div className="min-h-screen bg-background">
					<Header />
					<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
						{children}
					</main>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}