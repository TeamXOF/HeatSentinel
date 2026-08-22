import React, { useState } from 'react';
import {
  FileText,
  Download,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { useReports, ReportItem } from '../api';

export const ReportsPage: React.FC = () => {
  const { data: reports = [] } = useReports();
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const handleDownload = (id: string) => {
    setDownloadedId(id);
    setTimeout(() => {
      setDownloadedId(null);
    }, 2000);
  };

  return (
    <div id="reports-page" className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#F1F5F9] rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D9488] shrink-0">
            <FileText size={22} strokeWidth={2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Reports & Analytical Exports
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                {reports.length} Published
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Automated briefing packages, incident summaries, and raw spatial GIS datasets ready for download.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {}}
          className="min-h-[40px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:outline-none transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
        >
          <Sparkles size={14} />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Reports Table Card with Horizontal Scroll Affordance */}
      <div className="bg-white border border-[#F1F5F9] rounded-3xl overflow-hidden shadow-xs relative">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[560px] sm:min-w-full">
            <caption className="sr-only">Published municipal heat hazard reports and analytical exports</caption>
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th scope="col" className="py-3.5 px-4 sm:px-5">Report Document</th>
                <th scope="col" className="py-3.5 px-3 sm:px-4">Category</th>
                <th scope="col" className="py-3.5 px-3 sm:px-4">Date</th>
                <th scope="col" className="py-3.5 px-3 sm:px-4">Format & Size</th>
                <th scope="col" className="py-3.5 px-4 sm:px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {reports.map((rep: ReportItem) => (
                <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 sm:px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        {rep.format === 'PDF' ? (
                          <FileText size={16} className="text-[#DC2626]" />
                        ) : rep.format === 'CSV' ? (
                          <FileSpreadsheet size={16} className="text-[#0D9488]" />
                        ) : (
                          <FileText size={16} className="text-[#0284C7]" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{rep.title}</div>
                        <div className="text-[11px] text-slate-500">Author: {rep.author}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-3 sm:px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                      {rep.category}
                    </span>
                  </td>

                  <td className="py-4 px-3 sm:px-4 text-slate-600 font-medium">
                    {rep.date}
                  </td>

                  <td className="py-4 px-3 sm:px-4">
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {rep.format} • {rep.size}
                    </span>
                  </td>

                  <td className="py-4 px-4 sm:px-5 text-right">
                    <button
                      type="button"
                      aria-label={`Download ${rep.title}`}
                      onClick={() => handleDownload(rep.id)}
                      className={`min-h-[34px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:outline-none transition-all cursor-pointer ${
                        downloadedId === rep.id
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {downloadedId === rep.id ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <Download size={13} />
                          <span>Download</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
