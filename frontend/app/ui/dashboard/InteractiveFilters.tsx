"use client";

import { useEffect, useState } from "react";
import { InteractiveFilterDef } from "@/app/lib/definitions";
import { DASHBOARD_CHART_DISTINCT_VALS } from "@/app/lib/constants";
import { ChevronDownIcon, XMarkIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  dashboardId: string;
  filters: InteractiveFilterDef[];
  onFilterChange: (filterValues: Record<string, any>) => void;
}

export default function InteractiveFilters({ dashboardId, filters, onFilterChange }: Props) {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [distinctValues, setDistinctValues] = useState<Record<string, string[]>>({});
  const [rangeBounds, setRangeBounds] = useState<Record<string, { min: number; max: number }>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState(true);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({}); // for multiselect search

  // Fetch distinct values for dropdowns/multiselects and min/max for ranges
  useEffect(() => {
    filters.forEach(async (filter) => {
      if (filter.type === "dropdown" || filter.type === "multiselect") {
        setLoading((prev) => ({ ...prev, [filter.column]: true }));
        try {
          const url = DASHBOARD_CHART_DISTINCT_VALS(Number(dashboardId));
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ column: filter.column }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const values = await response.json();
          setDistinctValues((prev) => ({ ...prev, [filter.column]: values }));
        } catch (error) {
          console.error(`Failed to fetch distinct values for ${filter.column}:`, error);
        } finally {
          setLoading((prev) => ({ ...prev, [filter.column]: false }));
        }
      } else if (filter.type === "range") {
        try {
          setLoading((prev) => ({ ...prev, [filter.column]: true }));
          const minResponse = await fetch(DASHBOARD_CHART_DISTINCT_VALS(Number(dashboardId)), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ column: filter.column, sort: "asc", limit: 1 }),
          });
          const maxResponse = await fetch(DASHBOARD_CHART_DISTINCT_VALS(Number(dashboardId)), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ column: filter.column, sort: "desc", limit: 1 }),
          });
          if (minResponse.ok && maxResponse.ok) {
            const min = await minResponse.json();
            const max = await maxResponse.json();
            setRangeBounds((prev) => ({
              ...prev,
              [filter.column]: { min: min[0] || 0, max: max[0] || 100 },
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch range bounds for ${filter.column}:`, error);
        } finally {
          setLoading((prev) => ({ ...prev, [filter.column]: false }));
        }
      }
    });
  }, [dashboardId, filters]);

  const handleChange = (column: string, value: any) => {
    setFilterValues((prev) => ({ ...prev, [column]: value }));
    onFilterChange({ ...filterValues, [column]: value });
  };

  const handleRangeChange = (column: string, min: number | undefined, max: number | undefined) => {
    const newValues = {
      ...filterValues,
      [`${column}_min`]: min,
      [`${column}_max`]: max,
    };
    setFilterValues(newValues);
    onFilterChange(newValues);
  };

  const clearAllFilters = () => {
    setFilterValues({});
    onFilterChange({});
  };

  const activeFilterCount = Object.keys(filterValues).filter((key) => {
    const val = filterValues[key];
    if (key.endsWith("_min") || key.endsWith("_max")) return false;
    return val !== undefined && val !== "" && (!Array.isArray(val) || val.length > 0);
  }).length;

  return (
    <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="gap-2">
          <FunnelIcon className="w-4 h-4" />
          <span>Interactive Filters</span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </Button>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              {activeFilterCount} active
            </span>
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
              Clear all
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="space-y-4">
          {filters.map((filter) => (
            <div key={filter.column} className="space-y-2 bg-gray-50 p-3 rounded-lg">
              <Label className="text-xs font-medium">{filter.label}</Label>

              {/* Dropdown (single‑select) */}
              {filter.type === "dropdown" && (
                <Select
                  value={filterValues[filter.column] || ""}
                  onValueChange={(val) => handleChange(filter.column, val)}
                  disabled={loading[filter.column]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {distinctValues[filter.column]?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Multiselect with search */}
              {filter.type === "multiselect" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                      disabled={loading[filter.column]}
                    >
                      <div className="flex flex-wrap gap-1 truncate">
                        {filterValues[filter.column]?.length > 0 ? (
                          filterValues[filter.column].slice(0, 2).map((v: string) => (
                            <Badge key={v} variant="secondary" className="text-xs">
                              {v}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Select...</span>
                        )}
                        {filterValues[filter.column]?.length > 2 && (
                          <Badge variant="secondary">+{filterValues[filter.column].length - 2}</Badge>
                        )}
                      </div>
                      <ChevronDownIcon className="h-4 w-4 opacity-50 ml-auto" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search..."
                          value={searchTerms[filter.column] || ""}
                          onChange={(e) =>
                            setSearchTerms((prev) => ({ ...prev, [filter.column]: e.target.value }))
                          }
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <ScrollArea className="max-h-60">
                      <div className="p-2">
                        {distinctValues[filter.column]
                          ?.filter((opt) =>
                            opt.toLowerCase().includes((searchTerms[filter.column] || "").toLowerCase())
                          )
                          .map((opt) => {
                            const isSelected = (filterValues[filter.column] || []).includes(opt);
                            return (
                              <div
                                key={opt}
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                                onClick={() => {
                                  const current = filterValues[filter.column] || [];
                                  const updated = isSelected
                                    ? current.filter((v: string) => v !== opt)
                                    : [...current, opt];
                                  handleChange(filter.column, updated);
                                }}
                              >
                                <Checkbox checked={isSelected} />
                                <Label className="text-sm font-normal cursor-pointer">{opt}</Label>
                              </div>
                            );
                          })}
                        {distinctValues[filter.column]?.filter((opt) =>
                          opt.toLowerCase().includes((searchTerms[filter.column] || "").toLowerCase())
                        ).length === 0 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No options found
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              )}

              {/* Range slider */}
              {filter.type === "range" && rangeBounds[filter.column] && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500">Min</Label>
                      <Input
                        type="number"
                        value={filterValues[`${filter.column}_min`] || ""}
                        onChange={(e) =>
                          handleRangeChange(
                            filter.column,
                            e.target.value === "" ? undefined : Number(e.target.value),
                            filterValues[`${filter.column}_max`]
                          )
                        }
                        placeholder={`${rangeBounds[filter.column].min}`}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500">Max</Label>
                      <Input
                        type="number"
                        value={filterValues[`${filter.column}_max`] || ""}
                        onChange={(e) =>
                          handleRangeChange(
                            filter.column,
                            filterValues[`${filter.column}_min`],
                            e.target.value === "" ? undefined : Number(e.target.value)
                          )
                        }
                        placeholder={`${rangeBounds[filter.column].max}`}
                      />
                    </div>
                    {(filterValues[`${filter.column}_min`] !== undefined ||
                      filterValues[`${filter.column}_max`] !== undefined) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRangeChange(filter.column, undefined, undefined)}
                        className="self-end"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {/* Visual range indicator */}
                  {(filterValues[`${filter.column}_min`] !== undefined ||
                    filterValues[`${filter.column}_max`] !== undefined) && (
                    <div className="relative h-1 bg-gray-200 rounded-full">
                      <div
                        className="absolute h-full bg-purple-500 rounded-full"
                        style={{
                          left:
                            filterValues[`${filter.column}_min`] !== undefined
                              ? `${((filterValues[`${filter.column}_min`] - rangeBounds[filter.column].min) /
                                  (rangeBounds[filter.column].max - rangeBounds[filter.column].min)) *
                                  100}%`
                              : "0%",
                          right:
                            filterValues[`${filter.column}_max`] !== undefined
                              ? `${100 -
                                  ((filterValues[`${filter.column}_max`] - rangeBounds[filter.column].min) /
                                    (rangeBounds[filter.column].max - rangeBounds[filter.column].min)) *
                                    100}%`
                              : "0%",
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
