import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SessionFiltersProps {
  onFilterChange: (filters: SessionFilterState) => void;
  filters: SessionFilterState;
}

export interface SessionFilterState {
  search: string;
  client: string;
  project: string;
  tags: string[];
  hasNotes: boolean | null;
}

export const SessionFilters: React.FC<SessionFiltersProps> = ({ onFilterChange, filters }) => {
  const [expanded, setExpanded] = useState(false);
  const [inputTag, setInputTag] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, client: e.target.value });
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, project: e.target.value });
  };

  const handleAddTag = () => {
    if (inputTag && !filters.tags.includes(inputTag)) {
      onFilterChange({ ...filters, tags: [...filters.tags, inputTag] });
      setInputTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    onFilterChange({
      ...filters,
      tags: filters.tags.filter(t => t !== tag)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const toggleNotesFilter = () => {
    const newValue = filters.hasNotes === null ? true : filters.hasNotes === true ? false : null;
    onFilterChange({ ...filters, hasNotes: newValue });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      client: '',
      project: '',
      tags: [],
      hasNotes: null
    });
  };

  const hasActiveFilters = (
    filters.search.trim() !== '' ||
    filters.client.trim() !== '' ||
    filters.project.trim() !== '' ||
    filters.tags.length > 0 ||
    filters.hasNotes !== null
  );

  return (
    <div className="w-full bg-white rounded-lg border p-4 mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs h-8"
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex w-full gap-2 items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by title or content..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                placeholder="Filter by client name"
                value={filters.client}
                onChange={handleClientChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Input
                id="project"
                placeholder="Filter by project name"
                value={filters.project}
                onChange={handleProjectChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag"
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={handleAddTag} type="button">
                Add
              </Button>
            </div>
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <Button 
              variant={filters.hasNotes === true ? "default" : filters.hasNotes === false ? "destructive" : "outline"}
              size="sm"
              onClick={toggleNotesFilter}
              className="mr-2"
            >
              {filters.hasNotes === true ? "Has Notes" : filters.hasNotes === false ? "No Notes" : "Notes (Any)"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {filters.hasNotes === true ? "Showing only sessions with notes" : 
               filters.hasNotes === false ? "Showing only sessions without notes" : 
               "Notes filter is inactive"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
