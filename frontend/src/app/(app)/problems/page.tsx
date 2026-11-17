'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { problemsApi } from '@/lib/api';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  isPublished: boolean;
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span className={`badge badge-${difficulty.toLowerCase()}`}>{difficulty}</span>
  );
}

function ProblemSkeleton() {
  return (
    <tr>
      <td><div className="skeleton" style={{ height: 18, width: 30, borderRadius: 4 }} /></td>
      <td><div className="skeleton" style={{ height: 18, width: 220 }} /></td>
      <td><div className="skeleton" style={{ height: 20, width: 60, borderRadius: 999 }} /></td>
      <td><div className="skeleton" style={{ height: 18, width: 140, borderRadius: 999 }} /></td>
    </tr>
  );
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [selectedTag, setSelectedTag] = useState('');

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 25 };
      if (search) params.search = search;
      if (difficulty !== 'All') params.difficulty = difficulty;
      if (selectedTag) params.tag = selectedTag;

      const data = await problemsApi.list(params);
      setProblems(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, difficulty, selectedTag]);

  useEffect(() => {
    problemsApi.getTags().then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProblems();
  };

  return (
    <div className="page-content">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Problems</h1>
          <p style={{ fontSize: '0.9rem' }}>
            {total} problems · Practice and improve with AI hints
          </p>
        </div>

        {/* Filters */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            padding: '1rem 1.25rem',
          }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: 200 }}>
            <input
              id="problem-search"
              className="form-input"
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>

          <select
            id="difficulty-filter"
            className="form-select"
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
          >
            {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
          </select>

          <select
            id="tag-filter"
            className="form-select"
            value={selectedTag}
            onChange={(e) => { setSelectedTag(e.target.value); setPage(1); }}
          >
            <option value="">All Tags</option>
            {tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {(difficulty !== 'All' || selectedTag || search) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setDifficulty('All'); setSelectedTag(''); setSearch(''); setPage(1); }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => <ProblemSkeleton key={i} />)
                : problems.map((problem, idx) => (
                    <tr key={problem._id}>
                      <td style={{ color: 'var(--text-muted)', width: 50 }}>
                        {(page - 1) * 25 + idx + 1}
                      </td>
                      <td>
                        <Link
                          href={`/problems/${problem._id}`}
                          style={{
                            color: 'var(--text-primary)',
                            fontWeight: 500,
                            fontSize: '0.9375rem',
                          }}
                        >
                          {problem.title}
                        </Link>
                      </td>
                      <td>
                        <DifficultyBadge difficulty={problem.difficulty} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          {problem.tags?.slice(0, 3).map((tag) => (
                            <button
                              key={tag}
                              className="badge badge-tag"
                              onClick={() => { setSelectedTag(tag); setPage(1); }}
                              style={{ cursor: 'pointer', border: 'none' }}
                            >
                              {tag}
                            </button>
                          ))}
                          {problem.tags?.length > 3 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              +{problem.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              {!loading && problems.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No problems found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Page {page} of {pages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
