"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Play,
  Download,
  FileQuestion,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Grid,
  List
} from "lucide-react";
import Link from "next/link";
import type { ExamTemplate } from "@/types/exam-system";

interface ExamsListProps {
  exams: (ExamTemplate & { contentCount: number; attemptsCount: number })[];
  adminRole: string;
}

export default function ExamsList({ exams, adminRole }: ExamsListProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  const canEdit = ['super_admin', 'admin', 'course_manager'].includes(adminRole);
  const canDelete = ['super_admin', 'admin'].includes(adminRole);

  const getLanguageDisplay = (language: string) => {
    const languages: Record<string, string> = {
      english: 'English',
      valenciano: 'Valenciano',
      spanish: 'Español',
      french: 'Français',
      german: 'Deutsch',
      italian: 'Italiano',
      portuguese: 'Português'
    };
    return languages[language] || language;
  };

  const getProviderDisplay = (provider: string) => {
    const providers: Record<string, string> = {
      cambridge: 'Cambridge',
      eoi: 'EOI',
      cieacova: 'CIEACOVA',
      jqcv: 'JQCV',
      dele: 'DELE',
      delf: 'DELF',
      goethe: 'Goethe'
    };
    return providers[provider] || provider;
  };

  const getSkillDisplay = (skill: string) => {
    const skills: Record<string, string> = {
      reading: 'Reading',
      writing: 'Writing',
      listening: 'Listening',
      speaking: 'Speaking',
      use_of_english: 'Use of English',
      mediation: 'Mediation',
      integrated: 'Integrated'
    };
    return skills[skill] || skill;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      advanced: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileQuestion className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No exam templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            Get started by creating your first exam template or importing from the real-exams directory.
          </p>
          <div className="flex gap-2">
            <Button>Create Exam Template</Button>
            <Button variant="outline">Import from real-exams/</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {exams.length} exam template{exams.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {exam.name}
                      </div>
                      {exam.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                          {exam.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getLanguageDisplay(exam.language)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{exam.level}</Badge>
                  </TableCell>
                  <TableCell>{getProviderDisplay(exam.provider)}</TableCell>
                  <TableCell>{getSkillDisplay(exam.skill)}</TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(exam.difficulty_level)}>
                      {exam.difficulty_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileQuestion className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{exam.contentCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{exam.attemptsCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {exam.is_published ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          <XCircle className="w-3 h-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                      {!exam.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/exams/${exam.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {exam.is_published && (
                          <DropdownMenuItem asChild>
                            <Link href={`/examenes/${exam.id}/practicar`}>
                              <Play className="w-4 h-4 mr-2" />
                              Test Simulator
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {canEdit && (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/exams/${exam.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Template
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Template
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Exam Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{exam.name}"? This action cannot be undone
                                    and will also delete all associated content and user attempts.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                                    Delete Template
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{exam.name}</CardTitle>
                    {exam.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {exam.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {exam.is_published ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/exams/${exam.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/exams/${exam.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Badge variant="outline">{getLanguageDisplay(exam.language)}</Badge>
                  <Badge variant="outline">{exam.level}</Badge>
                  <Badge className={getDifficultyColor(exam.difficulty_level)}>
                    {exam.difficulty_level}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>{getProviderDisplay(exam.provider)} - {getSkillDisplay(exam.skill)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{exam.estimated_duration}min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileQuestion className="w-4 h-4 text-gray-400" />
                      <span>{exam.contentCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{exam.attemptsCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/admin/exams/${exam.id}`}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  {exam.is_published && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/examenes/${exam.id}/practicar`}>
                        <Play className="w-4 h-4 mr-1" />
                        Test
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}