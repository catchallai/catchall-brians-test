import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Presentation, Plus, Save, Download, Eye, Loader2, 
  Palette, Layout, Sparkles, FileText, FolderOpen, BookmarkPlus
} from "lucide-react";
import BrandingPanel from '@/components/pitch/BrandingPanel';
import SlideTemplates from '@/components/pitch/SlideTemplates';
import SlideEditor from '@/components/pitch/SlideEditor';
import DraggableSlideList from '@/components/pitch/DraggableSlideList';
import TemplateLibrary from '@/components/pitch/TemplateLibrary';
import SaveTemplateModal from '@/components/pitch/SaveTemplateModal';
import CollaborationPanel from '@/components/pitch/CollaborationPanel';
import PreviewModal from '@/components/pitch/PreviewModal';
import EmptyState from '@/components/ui/EmptyState';

export default function PitchDeckCreator() {
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [slides, setSlides] = useState([]);
  const [branding, setBranding] = useState({
    primary_color: '#7c3aed',
    secondary_color: '#a78bfa',
    background_color: '#ffffff',
    font_heading: 'Inter',
    font_body: 'Inter',
    logo_url: ''
  });
  const [deckTitle, setDeckTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingSlideIndex, setEditingSlideIndex] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'editor'
  const queryClient = useQueryClient();

  const { data: decks = [], isLoading } = useQuery({
    queryKey: ['pitch-decks'],
    queryFn: () => base44.entities.PitchDeck.list('-last_edited', 50),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.PitchDeckTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitch-deck-templates'] });
    },
  });

  const saveDeckMutation = useMutation({
    mutationFn: async (data) => {
      if (selectedDeck) {
        return base44.entities.PitchDeck.update(selectedDeck.id, data);
      }
      return base44.entities.PitchDeck.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitch-decks'] });
    },
  });

  const handleNewDeck = () => {
    setSelectedDeck(null);
    setSlides([]);
    setDeckTitle('Untitled Deck');
    setCompanyName('');
    setEditingSlideIndex(null);
    setViewMode('list');
    setBranding({
      primary_color: '#7c3aed',
      secondary_color: '#a78bfa',
      background_color: '#ffffff',
      font_heading: 'Inter',
      font_body: 'Inter',
      logo_url: ''
    });
  };

  const handleLoadTemplate = (template) => {
    setSlides(template.default_slides || []);
    setBranding(template.branding || branding);
    setDeckTitle(template.name);
    setCompanyName('');
    setEditingSlideIndex(null);
    setViewMode('list');
  };

  const handleSaveTemplate = async (data) => {
    await saveTemplateMutation.mutateAsync(data);
  };

  const handleLoadDeck = (deck) => {
    setSelectedDeck(deck);
    setSlides(deck.slides || []);
    setDeckTitle(deck.title || '');
    setCompanyName(deck.company_name || '');
    setBranding(deck.branding || branding);
    setEditingSlideIndex(null);
    setViewMode('list');
  };

  const handleAddSlide = (template) => {
    const newSlide = {
      id: `slide-${Date.now()}`,
      type: template.id,
      title: template.title,
      content: {},
      order: slides.length
    };
    setSlides([...slides, newSlide]);
  };

  const handleUpdateSlide = (index, updatedSlide) => {
    const newSlides = [...slides];
    newSlides[index] = updatedSlide;
    setSlides(newSlides);
  };

  const handleDeleteSlide = (index) => {
    setSlides(slides.filter((_, i) => i !== index));
    if (editingSlideIndex === index) {
      setEditingSlideIndex(null);
      setViewMode('list');
    }
  };

  const handleReorderSlides = (newSlides) => {
    setSlides(newSlides);
  };

  const handleEditSlide = (index) => {
    setEditingSlideIndex(index);
    setViewMode('editor');
  };

  const handleAIEnhance = async (index) => {
    const slide = slides[index];
    try {
      const enhanced = await base44.integrations.Core.InvokeLLM({
        prompt: `Enhance this pitch deck slide content. Make it more compelling and professional.
        
Slide Type: ${slide.type}
Title: ${slide.title}
Current Content: ${JSON.stringify(slide.content)}

Provide enhanced content with better wording, more impact, and professional tone.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "object" }
          }
        }
      });

      handleUpdateSlide(index, {
        ...slide,
        title: enhanced.title,
        content: enhanced.content
      });
    } catch (error) {
      console.error('AI enhancement failed:', error);
    }
  };

  const handleSave = async () => {
    const data = {
      title: deckTitle,
      company_name: companyName,
      slides,
      branding,
      status: 'draft',
      last_edited: new Date().toISOString()
    };
    const result = await saveDeckMutation.mutateAsync(data);
    setSelectedDeck(result);
    return result;
  };

  const handleExportPDF = async () => {
    try {
      let deckToExport = selectedDeck;
      if (!deckToExport) {
        deckToExport = await handleSave();
      }
      
      const response = await base44.functions.invoke('exportPitchDeckPDF', { 
        deckId: deckToExport.id 
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deckTitle || 'pitch-deck'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  const handleExportPPTX = async () => {
    try {
      let deckToExport = selectedDeck;
      if (!deckToExport) {
        deckToExport = await handleSave();
      }
      
      const response = await base44.functions.invoke('exportPitchDeckPPTX', { 
        deckId: deckToExport.id 
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deckTitle || 'pitch-deck'}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('PPTX export failed:', error);
    }
  };

  const handleLoadBrand = (brand) => {
    if (brand.brand_colors?.primary) {
      setBranding({
        ...branding,
        primary_color: brand.brand_colors.primary,
        secondary_color: brand.brand_colors.secondary || brand.brand_colors.primary,
        logo_url: brand.logo_url || ''
      });
    }
    setCompanyName(brand.name || '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Presentation className="w-6 h-6 text-violet-600" />
            <Input
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              placeholder="Deck Title"
              className="w-64 font-semibold border-0 bg-transparent focus-visible:ring-0"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateLibrary(true)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewDeck}
            >
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveTemplate(true)}
              disabled={slides.length === 0}
            >
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Save Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              disabled={slides.length === 0}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveDeckMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saveDeckMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save</>
              )}
            </Button>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportPDF}
                disabled={slides.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportPPTX}
                disabled={slides.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                PowerPoint
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            {/* Company Info */}
            <Card className="p-4 bg-white dark:bg-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Company Info</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Company Name</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company"
                    className="mt-1"
                  />
                </div>
                {brands.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Load from Brand</label>
                    <div className="space-y-1">
                      {brands.slice(0, 3).map(brand => (
                        <Button
                          key={brand.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadBrand(brand)}
                          className="w-full justify-start text-xs"
                        >
                          {brand.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Branding */}
            <BrandingPanel branding={branding} onChange={setBranding} />

            {/* Slide Templates */}
            <Card className="p-4 bg-white dark:bg-gray-800">
              <SlideTemplates onAdd={handleAddSlide} />
            </Card>

            {/* Collaboration */}
            <CollaborationPanel 
              collaborators={[]}
              currentUser={user}
            />

            {/* Saved Decks */}
            {decks.length > 0 && (
              <Card className="p-4 bg-white dark:bg-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Decks</h3>
                <div className="space-y-2">
                  {decks.slice(0, 5).map(deck => (
                    <button
                      key={deck.id}
                      onClick={() => handleLoadDeck(deck)}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                      <p className="font-medium text-gray-900 dark:text-white truncate">{deck.title}</p>
                      <p className="text-xs text-gray-500">{deck.slides?.length || 0} slides</p>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-9">
            {slides.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800 h-[600px]">
                <EmptyState
                  icon={Layout}
                  title="Start building your pitch deck"
                  description="Add slides from the template library on the left or load a template."
                  actionLabel="Browse Templates"
                  onAction={() => setShowTemplateLibrary(true)}
                />
              </Card>
            ) : (
              <>
                {/* View Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <Tabs value={viewMode} onValueChange={setViewMode}>
                    <TabsList>
                      <TabsTrigger value="list">Overview</TabsTrigger>
                      <TabsTrigger value="editor">Edit Slide</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {viewMode === 'editor' && editingSlideIndex !== null && (
                    <p className="text-sm text-gray-500">
                      Editing: Slide {editingSlideIndex + 1}
                    </p>
                  )}
                </div>

                {/* List View - Draggable */}
                {viewMode === 'list' && (
                  <DraggableSlideList
                    slides={slides}
                    branding={branding}
                    onReorder={handleReorderSlides}
                    onEdit={handleEditSlide}
                    onDelete={handleDeleteSlide}
                    onAIEnhance={handleAIEnhance}
                  />
                )}

                {/* Editor View */}
                {viewMode === 'editor' && editingSlideIndex !== null && (
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      ← Back to Overview
                    </Button>
                    <SlideEditor
                      slide={slides[editingSlideIndex]}
                      branding={branding}
                      onChange={(updated) => handleUpdateSlide(editingSlideIndex, updated)}
                      onDelete={() => handleDeleteSlide(editingSlideIndex)}
                      onAIEnhance={() => handleAIEnhance(editingSlideIndex)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TemplateLibrary
        open={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onSelect={handleLoadTemplate}
      />

      <SaveTemplateModal
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        onSave={handleSaveTemplate}
        currentDeck={{ branding, slides }}
      />

      <PreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        slides={slides}
        branding={branding}
        deckTitle={deckTitle}
        companyName={companyName}
      />
    </div>
  );
}