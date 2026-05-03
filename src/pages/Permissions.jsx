import TeamAccessMatrix from '@/components/settings/TeamAccessMatrix';

export default function Permissions() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <TeamAccessMatrix />
      </div>
    </div>
  );
}