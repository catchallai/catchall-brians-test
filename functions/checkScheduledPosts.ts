import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function should be run on a schedule (e.g., every hour)
// to check for posts that need to be published

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all scheduled posts that are due and have auto_post enabled
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    const allPosts = await base44.asServiceRole.entities.CalendarPost.filter({
      status: 'scheduled',
      auto_post: true
    });

    const duePosts = allPosts.filter(post => {
      const scheduledDate = post.scheduled_date;
      const scheduledHour = post.scheduled_hour || 9; // Default to 9 AM
      
      // Check if the post is due (same date and hour has passed)
      return scheduledDate === today && currentHour >= scheduledHour;
    });

    console.log(`Found ${duePosts.length} posts ready to publish`);

    const results = [];
    for (const post of duePosts) {
      try {
        // Call the auto-post function
        const response = await base44.asServiceRole.functions.invoke('autoPostToSocial', {
          postId: post.id
        });

        results.push({
          postId: post.id,
          success: response.data.success,
          results: response.data.results
        });
      } catch (error) {
        results.push({
          postId: post.id,
          success: false,
          error: error.message
        });
      }
    }

    return Response.json({
      checked: allPosts.length,
      published: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    console.error('Check scheduled posts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});