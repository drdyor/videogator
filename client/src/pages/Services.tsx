import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Check } from "lucide-react";
import { useState } from "react";

export default function Services() {
  const { data: services, isLoading } = trpc.services.list.useQuery();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"catalog" | "comparison">("catalog");

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectedServiceDetails = services?.filter((s) =>
    selectedServices.includes(s.id)
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const generalServices = services?.filter((s) => s.category === "general") || [];
  const pharmaServices = services?.filter((s) => s.category === "pharma") || [];
  const specializedServices = services?.filter((s) => s.category === "specialized") || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Video Generation Services</h1>
        <p className="text-muted-foreground text-lg">
          Explore and compare AI-powered video generation platforms
        </p>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="comparison" disabled={selectedServices.length === 0}>
            Compare ({selectedServices.length})
          </TabsTrigger>
        </TabsList>

        {/* Catalog View */}
        <TabsContent value="catalog" className="space-y-8">
          {/* General Services */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">🎬 General Video Generation</h2>
              <Badge variant="secondary">{generalServices.length} services</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generalServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedServices.includes(service.id)}
                  onToggleSelect={() => toggleServiceSelection(service.id)}
                  onCompare={() => {
                    if (!selectedServices.includes(service.id)) {
                      setSelectedServices([...selectedServices, service.id]);
                      setViewMode("comparison");
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Specialized Services */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">👤 Specialized Services</h2>
              <Badge variant="secondary">{specializedServices.length} services</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specializedServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedServices.includes(service.id)}
                  onToggleSelect={() => toggleServiceSelection(service.id)}
                  onCompare={() => {
                    if (!selectedServices.includes(service.id)) {
                      setSelectedServices([...selectedServices, service.id]);
                      setViewMode("comparison");
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Pharma Services */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">🧬 Pharmaceutical Specialization</h2>
              <Badge variant="secondary">{pharmaServices.length} services</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pharmaServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedServices.includes(service.id)}
                  onToggleSelect={() => toggleServiceSelection(service.id)}
                  onCompare={() => {
                    if (!selectedServices.includes(service.id)) {
                      setSelectedServices([...selectedServices, service.id]);
                      setViewMode("comparison");
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Comparison View */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Service Comparison</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedServices([])}
            >
              Clear Selection
            </Button>
          </div>

          {selectedServiceDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold text-muted-foreground">Feature</th>
                    {selectedServiceDetails.map((service) => (
                      <th key={service.id} className="text-left p-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{service.icon}</span>
                          <div>
                            <p className="font-bold">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{service.pricing}</p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 hover:bg-card/50">
                    <td className="p-4 font-semibold">Description</td>
                    {selectedServiceDetails.map((service) => (
                      <td key={service.id} className="p-4 text-sm">
                        {service.description}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-card/50">
                    <td className="p-4 font-semibold">Capabilities</td>
                    {selectedServiceDetails.map((service) => (
                      <td key={service.id} className="p-4">
                        <div className="flex flex-col gap-2">
                          {service.capabilities &&
                            JSON.parse(service.capabilities).map((cap: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-accent" />
                                {cap}
                              </div>
                            ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-card/50">
                    <td className="p-4 font-semibold">Website</td>
                    {selectedServiceDetails.map((service) => (
                      <td key={service.id} className="p-4">
                        {service.website && (
                          <a
                            href={service.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
                          >
                            Visit <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                Select services from the catalog to compare them side-by-side
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ServiceCardProps {
  service: any;
  isSelected: boolean;
  onToggleSelect: () => void;
  onCompare: () => void;
}

function ServiceCard({
  service,
  isSelected,
  onToggleSelect,
  onCompare,
}: ServiceCardProps) {
  const capabilities = service.capabilities
    ? JSON.parse(service.capabilities)
    : [];

  return (
    <Card
      className={`p-6 hover-lift cursor-pointer transition-all border-2 ${
        isSelected ? "border-accent bg-accent/5" : "border-border"
      }`}
      onClick={onToggleSelect}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{service.icon}</span>
            <div>
              <h3 className="font-bold text-lg">{service.name}</h3>
              <Badge variant="outline" className="mt-1">
                {service.category}
              </Badge>
            </div>
          </div>
          {isSelected && (
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <Check className="w-4 h-4 text-accent-foreground" />
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {service.description}
        </p>

        {/* Capabilities */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Capabilities</p>
          <div className="flex flex-wrap gap-1">
            {capabilities.slice(0, 3).map((cap: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {cap}
              </Badge>
            ))}
            {capabilities.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{capabilities.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-sm font-semibold text-accent">{service.pricing}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onCompare();
            }}
          >
            Compare
          </Button>
          {service.website && (
            <a
              href={service.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1"
            >
              <Button variant="ghost" size="sm" className="w-full">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
