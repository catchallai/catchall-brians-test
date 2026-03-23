import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import {
  FileSearch,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Target,
  Lightbulb,
} from 'lucide-react';

export default function PitchDeckAnalyzer() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      return;
    }
    setAnalyzing(true);

    try {
      // Upload file first
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Analyze with AI
      const prompt = `Analyze this pitch deck and provide comprehensive feedback. Evaluate:

1. Structure & Flow (score out of 10)
2. Problem Definition (score out of 10)
3. Solution Clarity (score out of 10)
4. Market Opportunity (score out of 10)
5. Business Model (score out of 10)
6. Traction & Metrics (score out of 10)
7. Team Presentation (score out of 10)
8. Financial Projections (score out of 10)
9. Funding Ask Clarity (score out of 10)
10. Visual Design (score out of 10)

For each category, provide:
- Score
- Strengths (what's working well)
- Weaknesses (what needs improvement)
- Specific recommendations

Also provide:
- Overall score
- Top 3 strengths
- Top 3 areas for improvement
- Investor readiness assessment (Ready, Nearly Ready, Needs Work)
- Key next steps`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            overall_score: { type: 'number' },
            investor_readiness: { type: 'string' },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  score: { type: 'number' },
                  strengths: { type: 'array', items: { type: 'string' } },
                  weaknesses: { type: 'array', items: { type: 'string' } },
                  recommendations: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            top_strengths: { type: 'array', items: { type: 'string' } },
            areas_for_improvement: { type: 'array', items: { type: 'string' } },
            next_steps: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      setAnalysis(response);
    } catch (error) {
      console.error('Error analyzing pitch deck:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) {
      return 'text-emerald-600';
    }
    if (score >= 6) {
      return 'text-amber-600';
    }
    return 'text-red-600';
  };

  const getReadinessColor = (status) => {
    if (status === 'Ready') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    }
    if (status === 'Nearly Ready') {
      return 'bg-amber-100 text-amber-700 border-amber-300';
    }
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getReadinessIcon = (status) => {
    if (status === 'Ready') {
      return <CheckCircle2 className="w-5 h-5" />;
    }
    if (status === 'Nearly Ready') {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <XCircle className="w-5 h-5" />;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileSearch className="w-8 h-8 text-blue-600" />
            Pitch Deck Analyzer
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            AI-powered analysis and feedback for your pitch deck
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upload Pitch Deck</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                accept=".pdf,.ppt,.pptx"
                onChange={handleFileChange}
                className="hidden"
                id="deck-upload"
              />
              <label htmlFor="deck-upload" className="cursor-pointer">
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {file ? file.name : 'Upload your pitch deck'}
                </p>
                <p className="text-sm text-gray-500">PDF or PowerPoint (Max 20MB)</p>
                <Button className="mt-4" variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>

            {file && (
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Deck...
                  </>
                ) : (
                  <>
                    <FileSearch className="w-5 h-5 mr-2" />
                    Analyze Pitch Deck
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              What We Analyze
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Problem & solution clarity</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Market opportunity sizing</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Business model viability</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Traction and metrics</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Team credibility</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Financial projections</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Visual design & flow</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {analysis && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Overall Score</p>
                  <p className={`text-5xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                    {analysis.overall_score}
                    <span className="text-2xl">/10</span>
                  </p>
                  <Progress value={analysis.overall_score * 10} className="mt-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Investor Readiness</p>
                  <Badge
                    className={`${getReadinessColor(analysis.investor_readiness)} px-4 py-2 text-base font-semibold border`}
                  >
                    <span className="flex items-center gap-2">
                      {getReadinessIcon(analysis.investor_readiness)}
                      {analysis.investor_readiness}
                    </span>
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Categories Analyzed</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analysis.categories?.length || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Top Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.top_strengths?.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.areas_for_improvement?.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Category Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {analysis.categories?.map((category, idx) => (
                <div
                  key={idx}
                  className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-6 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                      {category.score}/10
                    </span>
                  </div>
                  <Progress value={category.score * 10} className="mb-4" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                        Strengths
                      </p>
                      <ul className="space-y-1">
                        {category.strengths?.map((strength, i) => (
                          <li key={i} className="text-gray-600 dark:text-gray-400">
                            • {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400 mb-2">Weaknesses</p>
                      <ul className="space-y-1">
                        {category.weaknesses?.map((weakness, i) => (
                          <li key={i} className="text-gray-600 dark:text-gray-400">
                            • {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-400 mb-2">
                        Recommendations
                      </p>
                      <ul className="space-y-1">
                        {category.recommendations?.map((rec, i) => (
                          <li key={i} className="text-gray-600 dark:text-gray-400">
                            • {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-violet-600" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {analysis.next_steps?.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-600 font-semibold text-sm">{idx + 1}</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
