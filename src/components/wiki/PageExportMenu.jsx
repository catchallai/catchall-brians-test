import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, File } from 'lucide-react';

export default function PageExportMenu({ page }) {
  const exportAsPDF = async () => {
    // Create a simple HTML page for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${page.title}</title>
          <style>
            body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; }
            h1 { color: #333; margin-bottom: 20px; }
            .content { line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>${page.title}</h1>
          <div class="content">${page.content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const exportAsMarkdown = () => {
    // Convert HTML to basic markdown
    let markdown = `# ${page.title}\n\n`;

    // Simple HTML to Markdown conversion
    const text = page.content
      .replace(/<h1>/g, '# ')
      .replace(/<h2>/g, '## ')
      .replace(/<h3>/g, '### ')
      .replace(/<\/h[1-6]>/g, '\n\n')
      .replace(/<strong>/g, '**')
      .replace(/<\/strong>/g, '**')
      .replace(/<em>/g, '_')
      .replace(/<\/em>/g, '_')
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '');

    markdown += text;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const exportAsHTML = () => {
    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>${page.title}</title>
    <style>
      body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; }
      h1 { color: #333; margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <h1>${page.title}</h1>
    ${page.content}
  </body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.title.replace(/[^a-z0-9]/gi, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportAsPDF}>
          <File className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsMarkdown}>
          <FileText className="w-4 h-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsHTML}>
          <File className="w-4 h-4 mr-2" />
          Export as HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
