import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, Heart, MessageCircle, Share2, Repeat2 } from "lucide-react";

const PLATFORM_PREVIEWS = {
  twitter: {
    name: 'Twitter/X',
    width: 'w-full max-w-md',
    bgColor: 'bg-white dark:bg-black',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
  instagram: {
    name: 'Instagram',
    width: 'w-full max-w-sm',
    bgColor: 'bg-white dark:bg-black',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
  facebook: {
    name: 'Facebook',
    width: 'w-full max-w-md',
    bgColor: 'bg-white dark:bg-gray-900',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
  linkedin: {
    name: 'LinkedIn',
    width: 'w-full max-w-lg',
    bgColor: 'bg-white dark:bg-gray-950',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
};

function TwitterPreview({ post }) {
  return (
    <div className={`${PLATFORM_PREVIEWS.twitter.width} ${PLATFORM_PREVIEWS.twitter.bgColor} ${PLATFORM_PREVIEWS.twitter.borderColor} border rounded-2xl overflow-hidden`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 dark:text-white">Your Account</div>
            <div className="text-gray-500 text-sm">@yourhandle</div>
          </div>
        </div>
      </div>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white text-base leading-normal whitespace-pre-wrap">{post.caption}</p>
        {post.media_url && (
          <div className="mt-3 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            {post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
              <video src={post.media_url} className="w-full h-auto max-h-96 object-cover" />
            ) : (
              <img src={post.media_url} alt="Post" className="w-full h-auto max-h-96 object-cover" />
            )}
          </div>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="mt-3 text-blue-500 text-sm">
            {post.hashtags.map(tag => `#${tag}`).join(' ')}
          </div>
        )}
      </div>
      <div className="p-4 flex justify-around text-gray-500 text-sm">
        <button className="hover:text-blue-500 flex items-center gap-2"><MessageCircle size={16} /> Reply</button>
        <button className="hover:text-green-500 flex items-center gap-2"><Repeat2 size={16} /> Retweet</button>
        <button className="hover:text-red-500 flex items-center gap-2"><Heart size={16} /> Like</button>
        <button className="hover:text-blue-500 flex items-center gap-2"><Share2 size={16} /> Share</button>
      </div>
    </div>
  );
}

function InstagramPreview({ post }) {
  return (
    <div className={`${PLATFORM_PREVIEWS.instagram.width} ${PLATFORM_PREVIEWS.instagram.bgColor} ${PLATFORM_PREVIEWS.instagram.borderColor} border rounded-lg overflow-hidden`}>
      <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 p-3">
        <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
          <span className="font-bold text-lg">instagram</span>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-pink-600"></div>
        </div>
      </div>
      <div className="bg-white dark:bg-black">
        {post.media_url && (
          <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
            {post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
              <video src={post.media_url} className="w-full h-full object-cover" />
            ) : (
              <img src={post.media_url} alt="Post" className="w-full h-full object-cover" />
            )}
          </div>
        )}
        <div className="p-4">
          <div className="flex gap-3 text-gray-700 dark:text-gray-300 mb-3">
            <Heart size={24} className="hover:text-red-500 cursor-pointer" />
            <MessageCircle size={24} className="hover:text-gray-500 cursor-pointer" />
            <Share2 size={24} className="hover:text-gray-500 cursor-pointer" />
          </div>
          <div className="font-bold text-gray-900 dark:text-white text-sm mb-2">12,345 likes</div>
          <div className="text-sm">
            <span className="font-bold text-gray-900 dark:text-white">Your Account </span>
            <span className="text-gray-900 dark:text-white">{post.caption}</span>
          </div>
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="text-blue-500 text-sm mt-2">
              {post.hashtags.map(tag => `#${tag}`).join(' ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FacebookPreview({ post }) {
  return (
    <div className={`${PLATFORM_PREVIEWS.facebook.width} ${PLATFORM_PREVIEWS.facebook.bgColor} ${PLATFORM_PREVIEWS.facebook.borderColor} border rounded-lg overflow-hidden`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600"></div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white">Your Account</div>
            <div className="text-gray-500 text-xs">2 minutes ago</div>
          </div>
        </div>
      </div>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white mb-3 whitespace-pre-wrap">{post.caption}</p>
        {post.media_url && (
          <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3">
            {post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
              <video src={post.media_url} className="w-full h-auto max-h-96 object-cover" />
            ) : (
              <img src={post.media_url} alt="Post" className="w-full h-auto max-h-96 object-cover" />
            )}
          </div>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="text-blue-600 text-sm">
            {post.hashtags.map(tag => `#${tag}`).join(' ')}
          </div>
        )}
      </div>
      <div className="p-3 flex justify-around text-gray-600 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
        <button className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"><Heart size={16} /> Like</button>
        <button className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"><MessageCircle size={16} /> Comment</button>
        <button className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"><Share2 size={16} /> Share</button>
      </div>
    </div>
  );
}

function LinkedInPreview({ post }) {
  return (
    <div className={`${PLATFORM_PREVIEWS.linkedin.width} ${PLATFORM_PREVIEWS.linkedin.bgColor} ${PLATFORM_PREVIEWS.linkedin.borderColor} border rounded-lg overflow-hidden`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-700"></div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 dark:text-white">Your Account</div>
            <div className="text-gray-500 text-sm">Your Title • 2m</div>
          </div>
        </div>
      </div>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{post.caption}</p>
        {post.media_url && (
          <div className="mt-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            {post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
              <video src={post.media_url} className="w-full h-auto max-h-96 object-cover" />
            ) : (
              <img src={post.media_url} alt="Post" className="w-full h-auto max-h-96 object-cover" />
            )}
          </div>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="mt-3 text-blue-600 text-sm">
            {post.hashtags.map(tag => `#${tag}`).join(' ')}
          </div>
        )}
      </div>
      <div className="p-4 flex justify-around text-gray-600 dark:text-gray-400 text-sm">
        <button className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"><Heart size={16} /> Like</button>
        <button className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"><MessageCircle size={16} /> Comment</button>
        <button className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"><Repeat2 size={16} /> Repost</button>
        <button className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"><Share2 size={16} /> Send</button>
      </div>
    </div>
  );
}

export default function PostPreviewModal({ open, onClose, post }) {
  const [selectedPlatform, setSelectedPlatform] = useState(post?.platform || 'twitter');

  if (!post) return null;

  const platformNames = {
    twitter: 'Twitter/X',
    instagram: 'Instagram',
    facebook: 'Facebook',
    linkedin: 'LinkedIn'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Post Preview</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Platform Tabs */}
          <div className="lg:w-1/3">
            <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="twitter" className="text-xs sm:text-sm">Twitter</TabsTrigger>
                <TabsTrigger value="instagram" className="text-xs sm:text-sm">Instagram</TabsTrigger>
                <TabsTrigger value="facebook" className="text-xs sm:text-sm">Facebook</TabsTrigger>
                <TabsTrigger value="linkedin" className="text-xs sm:text-sm">LinkedIn</TabsTrigger>
              </TabsList>

              <div className="mt-6 flex justify-center">
                <TabsContent value="twitter" className="w-full">
                  <TwitterPreview post={post} />
                </TabsContent>
                <TabsContent value="instagram" className="w-full">
                  <InstagramPreview post={post} />
                </TabsContent>
                <TabsContent value="facebook" className="w-full">
                  <FacebookPreview post={post} />
                </TabsContent>
                <TabsContent value="linkedin" className="w-full">
                  <LinkedInPreview post={post} />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Post Details */}
          <div className="lg:w-2/3 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Caption</h3>
              <p className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white whitespace-pre-wrap text-sm">
                {post.caption}
              </p>
            </div>

            {post.media_url && (
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Media</h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden max-h-64">
                  {post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={post.media_url} controls className="w-full h-auto" />
                  ) : (
                    <img src={post.media_url} alt="Post" className="w-full h-auto object-cover" />
                  )}
                </div>
              </div>
            )}

            {post.hashtags && post.hashtags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Hashtags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {post.platform && (
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Assigned Platform</h3>
                <div className="px-3 py-2 bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 rounded-lg text-sm font-medium inline-block">
                  {platformNames[post.platform] || post.platform}
                </div>
              </div>
            )}

            {post.scheduled_date && (
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Scheduled Date</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date(post.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}