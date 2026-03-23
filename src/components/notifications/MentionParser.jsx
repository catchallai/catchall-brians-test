// Parse mentions from message content and return array of mentioned emails
export const extractMentions = (content, users = []) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const mentionedName = match[1];
    // Find user by name or email
    const user = users.find(
      (u) =>
        u.full_name?.toLowerCase().includes(mentionedName.toLowerCase()) ||
        u.email?.toLowerCase().startsWith(mentionedName.toLowerCase())
    );
    if (user) {
      mentions.push(user.email);
    }
  }

  return [...new Set(mentions)]; // Remove duplicates
};

// Create notification for mentioned users
export const createMentionNotifications = async (base44, messageData, mentionedEmails) => {
  if (mentionedEmails.length === 0) {
    return;
  }

  const notificationsToCreate = mentionedEmails.map((email) => ({
    user_email: email,
    type: 'mention',
    title: `${messageData.sender_name} mentioned you`,
    body: messageData.content.substring(0, 100),
    related_entity_type: 'Message',
    related_entity_id: messageData.id,
    actor_name: messageData.sender_name,
    actor_email: messageData.sender_email,
    action_url: `/ics?channel=${messageData.channel_id}`,
  }));

  try {
    await base44.entities.Notification.bulkCreate(notificationsToCreate);
  } catch (err) {
    console.error('Failed to create mention notifications:', err);
  }
};

// Highlight mentions in message content
export const highlightMentions = (content) => {
  return content.replace(
    /@(\w+)/g,
    '<span class="bg-yellow-100 dark:bg-yellow-900 px-1 rounded font-semibold">@$1</span>'
  );
};
