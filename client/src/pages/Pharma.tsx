import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Settings } from "lucide-react";
import { useState } from "react";

export default function Pharma() {
  const { data: templates, isLoading } = trpc.pharma.templates.useQuery();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [parameters, setParameters] = useState<Record<string, any>>({});

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    if (template.parameters) {
      const params = JSON.parse(template.parameters);
      const initialValues: Record<string, any> = {};
      Object.entries(params).forEach(([key, param]: [string, any]) => {
        initialValues[key] = param.default || "";
      });
      setParameters(initialValues);
    }
    setIsConfigDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">🧬 Pharma Molecular Visualizer</h1>
        <p className="text-muted-foreground text-lg">
          Create stunning, scientifically-accurate molecular animations for drug discovery and biotech
        </p>
      </div>

      {/* Enterprise Banner */}
      <Card className="p-6 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Enterprise Solution</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Specialized molecular animation rendering for pharmaceutical companies
            </p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300">$20k/month</Badge>
        </div>
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <div className="text-2xl">🔬</div>
          <h3 className="font-semibold">Scientific Accuracy</h3>
          <p className="text-sm text-muted-foreground">
            Physics-based molecular dynamics and accurate binding simulations
          </p>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-2xl">⚙️</div>
          <h3 className="font-semibold">Fully Customizable</h3>
          <p className="text-sm text-muted-foreground">
            Configure every aspect: colors, speeds, camera angles, and more
          </p>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-2xl">🎬</div>
          <h3 className="font-semibold">High-Fidelity Output</h3>
          <p className="text-sm text-muted-foreground">
            4K rendering with professional-grade visual quality
          </p>
        </Card>
      </div>

      {/* Templates */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Available Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template: any) => (
            <PharmaTemplateCard
              key={template.id}
              template={template}
              onSelect={() => handleTemplateSelect(template)}
            />
          ))}
        </div>
      </div>

      {/* Template Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Template: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-6">
              {/* Template Info */}
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              </div>

              {/* Parameters */}
              {selectedTemplate.parameters && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Configuration Parameters</h3>
                  {Object.entries(JSON.parse(selectedTemplate.parameters)).map(
                    ([key, param]: [string, any]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-sm font-medium">
                          {param.label || key}
                        </label>
                        {param.type === "string" && (
                          <input
                            type="text"
                            value={parameters[key] || ""}
                            onChange={(e) =>
                              setParameters({
                                ...parameters,
                                [key]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground"
                            placeholder={param.default}
                          />
                        )}
                        {param.type === "number" && (
                          <input
                            type="number"
                            value={parameters[key] || param.default}
                            onChange={(e) =>
                              setParameters({
                                ...parameters,
                                [key]: parseFloat(e.target.value),
                              })
                            }
                            min={param.min}
                            max={param.max}
                            step={0.1}
                            className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground"
                          />
                        )}
                        {param.type === "color" && (
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={parameters[key] || param.default}
                              onChange={(e) =>
                                setParameters({
                                  ...parameters,
                                  [key]: e.target.value,
                                })
                              }
                              className="w-12 h-10 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={parameters[key] || param.default}
                              onChange={(e) =>
                                setParameters({
                                  ...parameters,
                                  [key]: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm font-mono"
                            />
                          </div>
                        )}
                        {param.type === "boolean" && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={parameters[key] || param.default}
                              onChange={(e) =>
                                setParameters({
                                  ...parameters,
                                  [key]: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            <span className="text-sm">Enable</span>
                          </label>
                        )}
                        {param.options && (
                          <select
                            value={parameters[key] || param.default}
                            onChange={(e) =>
                              setParameters({
                                ...parameters,
                                [key]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground"
                          >
                            {param.options.map((opt: string) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                        {param.description && (
                          <p className="text-xs text-muted-foreground">
                            {param.description}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Preview */}
              {selectedTemplate.previewImage && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Preview</h3>
                  <img
                    src={selectedTemplate.previewImage}
                    alt={selectedTemplate.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsConfigDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => {
                    alert("Rendering configuration saved. This would queue a render job in production.");
                    setIsConfigDialogOpen(false);
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Queue Render
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pricing Section */}
      <Card className="p-8 space-y-4 bg-gradient-to-br from-accent/10 to-secondary/10 border border-accent/30">
        <h3 className="text-2xl font-bold">Enterprise Pricing</h3>
        <p className="text-muted-foreground">
          Our pharmaceutical molecular visualization service is designed for enterprise clients
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div>
            <p className="font-semibold">Starter Plan</p>
            <p className="text-2xl font-bold mt-2">$5,000<span className="text-lg text-muted-foreground">/month</span></p>
            <ul className="text-sm text-muted-foreground mt-3 space-y-1">
              <li>✓ 2 custom renders/month</li>
              <li>✓ Standard templates</li>
              <li>✓ Email support</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Professional Plan</p>
            <p className="text-2xl font-bold mt-2">$20,000<span className="text-lg text-muted-foreground">/month</span></p>
            <ul className="text-sm text-muted-foreground mt-3 space-y-1">
              <li>✓ Unlimited renders</li>
              <li>✓ Custom templates</li>
              <li>✓ Priority support</li>
              <li>✓ API access</li>
            </ul>
          </div>
        </div>
        <Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 w-full">
          Contact Sales
        </Button>
      </Card>
    </div>
  );
}

interface PharmaTemplateCardProps {
  template: any;
  onSelect: () => void;
}

function PharmaTemplateCard({ template, onSelect }: PharmaTemplateCardProps) {
  return (
    <Card className="overflow-hidden hover-lift cursor-pointer group">
      {/* Image */}
      {template.previewImage && (
        <div className="relative h-40 overflow-hidden bg-muted">
          <img
            src={template.previewImage}
            alt={template.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg">{template.name}</h3>
          <Badge variant="outline" className="mt-2">
            {template.category}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>

        {/* Parameters Preview */}
        {template.parameters && (
          <div className="text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Settings className="w-3 h-3" />
              {Object.keys(JSON.parse(template.parameters)).length} configurable parameters
            </span>
          </div>
        )}

        <Button
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={onSelect}
        >
          Configure & Render
        </Button>
      </div>
    </Card>
  );
}
