"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  FileQuestion,
  Settings
} from "lucide-react";
import { useState } from "react";

interface ExamsHeaderProps {
  adminRole: string;
}

export default function ExamsHeader({ adminRole }: ExamsHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");

  const canCreate = ['super_admin', 'admin', 'course_manager'].includes(adminRole);
  const canImport = ['super_admin', 'admin'].includes(adminRole);
  const canConfigure = ['super_admin', 'admin'].includes(adminRole);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
            <FileQuestion className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Exam Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage official exam templates and content
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canImport && (
            <>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Import from real-exams/
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Templates
              </Button>
            </>
          )}

          {canConfigure && (
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </Button>
          )}

          {canCreate && (
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Exam Template
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20">
              <FileQuestion className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-green-100 dark:bg-green-900/20">
              <Badge className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-yellow-100 dark:bg-yellow-900/20">
              <Settings className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Draft</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-purple-100 dark:bg-purple-900/20">
              <Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Attempts Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search exam templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Advanced Filters
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="valenciano">Valenciano</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
              <SelectItem value="italian">Italian</SelectItem>
              <SelectItem value="portuguese">Portuguese</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="A1">A1</SelectItem>
              <SelectItem value="A2">A2</SelectItem>
              <SelectItem value="B1">B1</SelectItem>
              <SelectItem value="B2">B2</SelectItem>
              <SelectItem value="C1">C1</SelectItem>
              <SelectItem value="C2">C2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="cambridge">Cambridge</SelectItem>
              <SelectItem value="eoi">EOI</SelectItem>
              <SelectItem value="cieacova">CIEACOVA</SelectItem>
              <SelectItem value="jqcv">JQCV</SelectItem>
              <SelectItem value="dele">DELE</SelectItem>
              <SelectItem value="delf">DELF</SelectItem>
              <SelectItem value="goethe">Goethe</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || selectedLanguage !== "all" || selectedLevel !== "all" || selectedProvider !== "all") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery("");
                setSelectedLanguage("all");
                setSelectedLevel("all");
                setSelectedProvider("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}