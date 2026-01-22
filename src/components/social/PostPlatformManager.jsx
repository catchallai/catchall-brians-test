import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import { format } from 'date-fns';

const PLATFORMS = ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'];

const PLATFORM_COLORS = {
  Twitter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  LinkedIn: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  Facebook: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
};

export default function PostPlatformManager({ posts = [], onUpdatePost }) {
  const [expandedPlatforms, setExpandedPlatforms] = useState(Object.fromEntries(PLATFORMS.map(p => [p, true])));
  const [selectedPostId, setSelectedPostId] = useState(null);

  const togglePlatform = (postId, platform) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const currentPlatforms = post.platforms || [];
    const newPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform];

    onUpdatePost({ id: postId, platforms: newPlatforms });
  };

  const getPlatformPosts = (platform) => {
    return posts.filter(p => p.platforms && p.platforms.includes(platform));
  };

  const getUnassignedPosts = () => {
    return posts.filter(p => !p.platforms || p.platforms.length === 0);
  };

  const unassignedCount = getUnassignedPosts().length;

  return (
    <div className="space-y-4">
      {/* Unassigned Posts Alert */}
      {unassignedCount > 0 && (
        <Card className="border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">
              {unassignedCount} Post{unassignedCount !== 1 ? 's' : ''} Need Platform Assignment
            </p>
            <div className="flex flex-wrap gap-2">
              {getUnassignedPosts().map(post => (
                <Button
                  key={post.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPostId(post.id)}
                  className="bg-white dark:bg-gray-800 text-xs"
                >
                  {post.title || 'Untitled'} ({format(new Date(post.scheduled_date), 'MMM d')})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Sections */}
      <div className="space-y-4">
        {PLATFORMS.map(platform => {
          const platformPosts = getPlatformPosts(platform);
          const isExpanded = expandedPlatforms[platform];

          return (
            <Card key={platform} className="rounded-2xl">
              <CardHeader className="pb-3">
                <button
                  onClick={() => setExpandedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }))}
                  className="w-full text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 -m-4 p-4 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{platform}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {platformPosts.length}
                    </Badge>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  {platformPosts.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                      No posts assigned to {platform}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {platformPosts.map(post => (
                        <div
                          key={post.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            selectedPostId === post.id
                              ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700'
                              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                {post.title || 'Untitled'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {format(new Date(post.scheduled_date), 'MMM d, yyyy')}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {post.status}
                                </Badge>
                              </div>
                              {post.caption && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                  {post.caption}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0 text-gray-400 hover:text-red-600"
                              onClick={() => togglePlatform(post.id, platform)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Post Details Modal for Quick Assignment */}
      {selectedPostId && (
        <Card className="rounded-2xl border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Quick Platform Assignment</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setSelectedPostId(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {posts.find(p => p.id === selectedPostId) && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {posts.find(p => p.id === selectedPostId)?.title || 'Untitled'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {format(new Date(posts.find(p => p.id === selectedPostId).scheduled_date), 'MMM d, yyyy')}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                    Select Platforms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(platform => {
                      const post = posts.find(p => p.id === selectedPostId);
                      const isSelected = post?.platforms?.includes(platform);
                      return (
                        <Button
                          key={platform}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => togglePlatform(selectedPostId, platform)}
                          className={isSelected ? PLATFORM_COLORS[platform] : ''}
                        >
                          {platform}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}