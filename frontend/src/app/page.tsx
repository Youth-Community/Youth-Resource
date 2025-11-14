import Layout from '@/components/layout/Layout';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  PlayIcon,
  BookOpenIcon,
  MicrophoneIcon,
  LightBulbIcon,
  ArrowRightIcon,
  StarIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface FeaturedContent {
  id: string;
  title: string;
  description: string;
  contentType: string;
  authorName: string;
  thumbnailUrl?: string;
  viewCount: number;
  rating: number;
  categorySlug: string;
  createdAt: string;
}

interface Podcast {
  id: string;
  title: string;
  description: string;
  authorName: string;
  audioDuration: number;
  coverArtUrl?: string;
  playCount: number;
  categorySlug: string;
}

export default function HomePage() {
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);
  const [recentPodcasts, setRecentPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedContent();
    fetchRecentPodcasts();
  }, []);

  const fetchFeaturedContent = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/content?featured=true&limit=6');
      if (response.ok) {
        const data = await response.json();
        setFeaturedContent(data.data.content);
      }
    } catch (error) {
      console.error('Error fetching featured content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPodcasts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/podcasts?limit=3');
      if (response.ok) {
        const data = await response.json();
        setRecentPodcasts(data.data.podcasts);
      }
    } catch (error) {
      console.error('Error fetching recent podcasts:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarIconSolid key="half" className="h-4 w-4 text-yellow-400 opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'article':
        return <BookOpenIcon className="h-6 w-6" />;
      case 'course':
        return <PlayIcon className="h-6 w-6" />;
      case 'podcast':
        return <MicrophoneIcon className="h-6 w-6" />;
      case 'idea':
        return <LightBulbIcon className="h-6 w-6" />;
      default:
        return <BookOpenIcon className="h-6 w-6" />;
    }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Empowering Youth Through
              <br />
              Quality Education
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100">
              Access thousands of resources, podcasts, courses, and connect with a global learning community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/content"
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center"
              >
                Explore Content
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/signup"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition"
              >
                Join Free Today
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Youth Resources?</h2>
            <p className="text-lg text-gray-600">Everything you need to accelerate your learning journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpenIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rich Content Library</h3>
              <p className="text-gray-600">Thousands of articles, books, and resources covering diverse topics</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MicrophoneIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Podcasts</h3>
              <p className="text-gray-600">Learn from industry experts through engaging audio content</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <UserGroupIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Active Community</h3>
              <p className="text-gray-600">Connect with peers, share ideas, and grow together</p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Content</h2>
            <Link
              href="/content"
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
            >
              View All
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredContent.map((content) => (
                <div key={content.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    {getContentTypeIcon(content.contentType)}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center mb-2">
                      {getContentTypeIcon(content.contentType)}
                      <span className="ml-2 text-sm text-gray-500 capitalize">{content.contentType}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">{content.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{content.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>By {content.authorName}</span>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {new Date(content.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center">
                        {renderStars(content.rating)}
                        <span className="ml-1 text-sm text-gray-500">({content.rating})</span>
                      </div>
                      <span className="text-sm text-gray-500">{content.viewCount} views</span>
                    </div>
                    <Link
                      href={`/content/${content.id}`}
                      className="mt-4 block w-full text-center bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Recent Podcasts</h2>
            <Link
              href="/podcasts"
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
            >
              View All
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentPodcasts.map((podcast) => (
              <div key={podcast.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="h-40 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <MicrophoneIcon className="h-12 w-12 text-white" />
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-2">
                    <MicrophoneIcon className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm text-gray-500">Podcast</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">{podcast.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{podcast.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>By {podcast.authorName}</span>
                    <span>{formatDuration(podcast.audioDuration)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{podcast.playCount} plays</span>
                    <Link
                      href={`/podcasts/${podcast.id}`}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Listen Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}