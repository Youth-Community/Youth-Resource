import Link from 'next/link';
import { AcademicCapIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <AcademicCapIcon className="h-8 w-8 text-indigo-400" />
              <span className="text-xl font-bold">Youth Resources</span>
            </div>
            <p className="text-gray-300 mb-4">
              Empowering youth with quality educational resources, podcasts, courses, and a supportive learning community.
            </p>
            <div className="flex space-x-4">
              <a href="mailto:info@youthresources.com" className="text-gray-300 hover:text-white">
                <EnvelopeIcon className="h-6 w-6" />
              </a>
              <a href="tel:+1234567890" className="text-gray-300 hover:text-white">
                <PhoneIcon className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/content" className="text-gray-300 hover:text-white">
                  Browse Content
                </Link>
              </li>
              <li>
                <Link href="/podcasts" className="text-gray-300 hover:text-white">
                  Podcasts
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-gray-300 hover:text-white">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/search?category=education" className="text-gray-300 hover:text-white">
                  Education
                </Link>
              </li>
              <li>
                <Link href="/search?category=technology" className="text-gray-300 hover:text-white">
                  Technology
                </Link>
              </li>
              <li>
                <Link href="/search?category=business" className="text-gray-300 hover:text-white">
                  Business
                </Link>
              </li>
              <li>
                <Link href="/search?category=health" className="text-gray-300 hover:text-white">
                  Health & Wellness
                </Link>
              </li>
              <li>
                <Link href="/search?category=personal-growth" className="text-gray-300 hover:text-white">
                  Personal Growth
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Youth Resources. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white text-sm">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}