import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Download, FileText, File, Presentation, WifiOff } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toaster'
import { supabase } from '@/lib/supabase'
import { formatDate, getFileIcon } from '@/lib/utils'

export default function NotesRepository() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('ALL')
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('name')
      if (error) return []
      return data || []
    },
  })

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          id,
          title,
          description,
          file_url,
          created_at,
          subject:subjects(id, name, code)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Error fetching notes:', error)
        return []
      }
      return data || []
    },
  })

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((item) => {
      // Subject filter
      if (selectedSubject !== 'ALL' && item.subject?.id !== selectedSubject) {
        return false
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const titleMatch = item.title?.toLowerCase().includes(query)
        const subMatch = item.subject?.name?.toLowerCase().includes(query)
        const descMatch = item.description?.toLowerCase().includes(query)
        return titleMatch || subMatch || descMatch
      }
      return true
    })
  }, [notes, selectedSubject, searchQuery])

  const handleDownload = (fileUrl, title) => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Download requires an internet connection.',
        variant: 'warning',
      })
      return
    }

    if (!fileUrl) {
      toast({
        title: 'File Unavailable',
        description: 'No download URL specified for this resource.',
        variant: 'destructive',
      })
      return
    }

    // Direct download or new window
    window.open(fileUrl, '_blank')
    toast({
      title: 'Download Initiated',
      description: `Opening ${title}...`,
      variant: 'success',
    })
  }

  const renderIcon = (url) => {
    const type = getFileIcon(url)
    if (type === 'presentation') {
      return <Presentation className="w-5 h-5 text-amber-warning shrink-0" />
    }
    return <FileText className="w-5 h-5 text-electric-blue shrink-0" />
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Study Resources" showBack />

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, PPTs, subjects..."
            className="w-full h-11 bg-navy-surface border border-border rounded-xl pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-electric-blue"
          />
        </div>

        {/* Subject filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 snap-scroll-x no-scrollbar">
          <button
            onClick={() => setSelectedSubject('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
              selectedSubject === 'ALL'
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-navy-surface text-text-secondary border-border hover:border-slate-medium'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                selectedSubject === sub.id
                  ? 'bg-electric-blue text-white border-electric-blue'
                  : 'bg-navy-surface text-text-secondary border-border hover:border-slate-medium'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        {/* Resources list */}
        {isLoading ? (
          <SkeletonList count={4} />
        ) : filteredNotes.length === 0 ? (
          <div className="svit-card text-center py-12">
            <File className="w-10 h-10 text-slate-medium mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-text-primary">No Resources Found</h4>
            <p className="text-xs text-text-secondary mt-1">
              Check another subject or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="svit-card flex items-start justify-between gap-3 transition-all hover:border-slate-medium"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-navy-surface border border-border mt-0.5">
                    {renderIcon(note.file_url)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-text-primary text-sm truncate">
                      {note.title}
                    </h4>
                    {note.description && (
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                        {note.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="theory" className="text-[10px]">
                        {note.subject?.name || 'CSE'}
                      </Badge>
                      <span className="text-[11px] text-text-secondary">
                        {formatDate(note.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(note.file_url, note.title)}
                  disabled={!isOnline}
                  className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                    isOnline
                      ? 'bg-navy-surface border-border text-electric-blue hover:bg-electric-blue hover:text-white'
                      : 'bg-slate-medium/30 border-border text-text-secondary cursor-not-allowed'
                  }`}
                  title={isOnline ? 'Download File' : 'Offline'}
                >
                  {isOnline ? (
                    <Download className="w-4 h-4" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

