import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default async function ImportPage() {
  await requireAuth("professor");

  return (
    <div>
      <PageHeader
        title="Import Courses & Students"
        subtitle="Import data from SMU systems"
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-smu-gold" />
            Import Feature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The import integration is being configured. When available, you will
            be able to import courses and student enrollments from the SMU source
            system.
          </p>
          <p className="text-sm text-muted-foreground">
            Supported import methods (coming soon):
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li>Direct API integration with SMU systems</li>
            <li>CSV file upload</li>
            <li>Manual data entry</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
