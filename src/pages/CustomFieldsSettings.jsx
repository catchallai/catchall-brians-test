import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomFieldManager from '@/components/crm/CustomFieldManager';

export default function CustomFieldsSettings() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const businessId = user?.current_business_id;

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Custom Fields</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Define custom fields for your contacts, companies, and deals
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contact" className="w-full">
        <TabsList>
          <TabsTrigger value="contact">Contacts</TabsTrigger>
          <TabsTrigger value="company">Companies</TabsTrigger>
          <TabsTrigger value="deal">Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="mt-6">
          <CustomFieldManager entityType="contact" businessId={businessId} />
        </TabsContent>

        <TabsContent value="company" className="mt-6">
          <CustomFieldManager entityType="company" businessId={businessId} />
        </TabsContent>

        <TabsContent value="deal" className="mt-6">
          <CustomFieldManager entityType="deal" businessId={businessId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
