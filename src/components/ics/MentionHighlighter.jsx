export default function MentionHighlighter({ content, mentions = [] }) {
  if (!mentions || mentions.length === 0) {
    return <>{content}</>;
  }

  let lastIndex = 0;
  const parts = [];

  const sortedMentions = mentions.sort((a, b) => a.index - b.index);

  sortedMentions.forEach(({ email, name, index, length }) => {
    if (index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, index)}</span>);
    }

    parts.push(
      <span
        key={`mention-${email}`}
        className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200 px-1 rounded font-semibold"
        title={email}
      >
        @{name || email.split('@')[0]}
      </span>
    );

    lastIndex = index + length;
  });

  if (lastIndex < content.length) {
    parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
  }

  return <>{parts}</>;
}
