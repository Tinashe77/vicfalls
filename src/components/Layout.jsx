// src/components/Layout.jsx with inactivity tracking
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  MapIcon,
  FlagIcon,
  EnvelopeIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useInactivityTracker } from '../utils/inactivityTracker';
import { initModalManager, showConfirm } from '../utils/modalManager';
import logo from '../assets/logo.png';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Runners', href: '/runners', icon: UsersIcon },
  { name: 'Routes', href: '/routes', icon: MapIcon },
  { name: 'Races', href: '/races', icon: FlagIcon },
  { name: 'Communications', href: '/communications', icon: EnvelopeIcon },
  { name: 'Admin Users', href: '/admin-users', icon: ShieldCheckIcon },
];

const Logo = () => (
  <div className="flex items-center gap-2 px-3 py-3">
    <img src={logo} alt="Econet Marathon" className="h-8 w-auto" />
    <span className="text-gray-800 text-base font-semibold">Econet Marathon</span>
  </div>
);

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Initialize the modal manager
  useEffect(() => {
    initModalManager();
  }, []);

  // Use our inactivity tracker
  useInactivityTracker();

  const handleLogout = () => {
    showConfirm(
      'Are you sure you want to logout?',
      logout,
      'Confirm Logout',
      'Logout',
      'Cancel'
    );
  };

  // Modified sidebar navigation component
  const NavLinks = () => (
    <div className="space-y-1 px-2">
      {navigation.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className={`
            group flex items-center gap-x-3 rounded-md p-2 text-sm font-medium
            transition-all duration-150 ease-in-out
            ${location.pathname === item.href
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          <item.icon 
            className={`h-5 w-5 shrink-0 transition-colors duration-150
              ${location.pathname === item.href ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-900'}
            `} 
            aria-hidden="true" 
          />
          {item.name}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="px-3">
                    <Logo />
                  </div>
                  <nav className="mt-5">
                    <NavLinks />
                  </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                  <button
                    onClick={handleLogout}
                    className="flex-shrink-0 group block w-full flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <div className="flex items-center">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          {user?.name || 'Admin User'}
                        </p>
                        <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                          Logout
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14" aria-hidden="true">
              {/* Force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="h-0 flex-1 flex flex-col pt-2 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 border-b border-gray-200 pb-4">
              <Logo />
            </div>
            <nav className="flex-1 mt-4">
              <NavLinks />
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <span className="text-sm font-medium">{user?.name?.charAt(0) || 'A'}</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name || 'Admin User'}
                  </p>
                  <button 
                    onClick={handleLogout}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 inline-flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="mr-1 h-3 w-3" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        {/* Top navbar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <button
            type="button"
            className="lg:hidden px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">View settings</span>
                <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;