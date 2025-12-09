import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Presentation, Download, Wand2, Loader2, FileText, Target, TrendingUp, Users } from "lucide-react";

export default function PitchDeckCreator() {
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    problem: '',
    solution: '',
    market_size: '',
    business_model: '',
    traction: '',
    team: '',
    ask: '',
    use_of_funds: ''
  });
  const [generating, setGenerating] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState(null);

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const prompt = `Create a professional pitch deck with the following information:
Company: ${formData.company_name}
Industry: ${formData.industry}
Problem: ${formData.problem}
Solution: ${formData.solution}
Market Size: ${formData.market_size}
Business Model: ${formData.business_model}
Traction: ${formData.traction}
Team: ${formData.team}
Funding Ask: ${formData.ask}
Use of Funds: ${formData.use_of_funds}

Generate a comprehensive pitch deck with 12-15 slides including: Cover, Problem, Solution, Market Opportunity, Product/Service, Business Model, Traction, Competition, Go-to-Market Strategy, Team, Financials, Funding Ask, and Contact.

For each slide, provide:
- Slide title
- Key talking points (3-5 bullet points)
- Visual suggestions
- Notes for presenter`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            slides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "array", items: { type: "string" } },
                  visual_suggestion: { type: "string" },
                  notes: { type: "string" }
                }
              }
            },
            executive_summary: { type: "string" }
          }
        }
      });

      setGeneratedDeck(response);
    } catch (error) {
      console.error('Error generating pitch deck:', error);
    } finally {
      setGenerating(false);
    }
  };

  const loadBrandData = (brand) => {
    setFormData({
      company_name: brand.name || '',
      industry: brand.industry || '',
      problem: '',
      solution: brand.description || '',
      market_size: '',
      business_model: '',
      traction: '',
      team: '',
      ask: '',
      use_of_funds: ''
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Presentation className="w-8 h-8 text-violet-600" />
            Pitch Deck Creator
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered pitch deck generator for your business</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-600" />
                Pitch Deck Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {brands.length > 0 && (
                <div>
                  <Label>Load from Brand</Label>
                  <div className="flex gap-2 mt-1">
                    {brands.slice(0, 3).map(brand => (
                      <Button
                        key={brand.id}
                        variant="outline"
                        size="sm"
                        onClick={() => loadBrandData(brand)}
                      >
                        {brand.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    placeholder="SaaS, E-commerce, etc."
                  />
                </div>
              </div>

              <div>
                <Label>Problem Statement</Label>
                <Textarea
                  value={formData.problem}
                  onChange={(e) => setFormData({...formData, problem: e.target.value})}
                  placeholder="What problem are you solving?"
                  rows={3}
                />
              </div>

              <div>
                <Label>Solution</Label>
                <Textarea
                  value={formData.solution}
                  onChange={(e) => setFormData({...formData, solution: e.target.value})}
                  placeholder="How does your product/service solve this problem?"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Market Size (TAM/SAM/SOM)</Label>
                  <Textarea
                    value={formData.market_size}
                    onChange={(e) => setFormData({...formData, market_size: e.target.value})}
                    placeholder="Total Addressable Market details"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Business Model</Label>
                  <Textarea
                    value={formData.business_model}
                    onChange={(e) => setFormData({...formData, business_model: e.target.value})}
                    placeholder="How do you make money?"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Label>Traction & Metrics</Label>
                <Textarea
                  value={formData.traction}
                  onChange={(e) => setFormData({...formData, traction: e.target.value})}
                  placeholder="Revenue, users, growth rate, partnerships, etc."
                  rows={2}
                />
              </div>

              <div>
                <Label>Team</Label>
                <Textarea
                  value={formData.team}
                  onChange={(e) => setFormData({...formData, team: e.target.value})}
                  placeholder="Key team members and their backgrounds"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Funding Ask</Label>
                  <Input
                    value={formData.ask}
                    onChange={(e) => setFormData({...formData, ask: e.target.value})}
                    placeholder="$2M Seed Round"
                  />
                </div>
                <div>
                  <Label>Use of Funds</Label>
                  <Input
                    value={formData.use_of_funds}
                    onChange={(e) => setFormData({...formData, use_of_funds: e.target.value})}
                    placeholder="50% Engineering, 30% Marketing, 20% Operations"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !formData.company_name}
                className="w-full bg-violet-600 hover:bg-violet-700"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Pitch Deck...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Pitch Deck
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-violet-600 font-semibold text-xs">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Keep it concise</p>
                  <p className="text-gray-500 text-xs">Investors typically spend 3-4 minutes per deck</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-violet-600 font-semibold text-xs">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Focus on the problem</p>
                  <p className="text-gray-500 text-xs">Make sure the problem is clear and relatable</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-violet-600 font-semibold text-xs">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Show traction</p>
                  <p className="text-gray-500 text-xs">Numbers and metrics build credibility</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-violet-600 font-semibold text-xs">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Highlight your team</p>
                  <p className="text-gray-500 text-xs">Investors invest in people, not just ideas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {generatedDeck && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Pitch Deck</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {generatedDeck.executive_summary && (
              <div className="mb-6 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                <p className="text-sm font-medium text-violet-900 dark:text-violet-300 mb-2">Executive Summary</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{generatedDeck.executive_summary}</p>
              </div>
            )}
            <div className="space-y-4">
              {generatedDeck.slides?.map((slide, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-violet-300 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{slide.title}</h3>
                      <ul className="space-y-2 mb-4">
                        {slide.content?.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-violet-500 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                      {slide.visual_suggestion && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 mb-2">
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">Visual Suggestion:</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{slide.visual_suggestion}</p>
                        </div>
                      )}
                      {slide.notes && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                          <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">Presenter Notes:</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{slide.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}