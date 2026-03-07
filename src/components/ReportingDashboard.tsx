import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Event, Attendee } from '../lib/database.types';
import { X, Download, Printer, TrendingUp, Users, CheckCircle2, Calendar } from 'lucide-react';

interface ReportingDashboardProps {
  event: Event;
  onClose: () => void;
}

interface ReportData {
  totalAttendees: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
  genderDistribution: Record<string, number>;
  organizationDistribution: Record<string, number>;
  registrationSourceDistribution: Record<string, number>;
  checkInsByHour: Record<string, number>;
  attendees: Attendee[];
}

export function ReportingDashboard({ event, onClose }: ReportingDashboardProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);
  const [topOrgLimit, setTopOrgLimit] = useState(10);

  useEffect(() => {
    loadReportData();
  }, [event.id]);

  const loadReportData = async () => {
    setLoading(true);
    const { data: attendees, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', event.id);

    if (!error && attendees) {
      const checkedIn = attendees.filter(a => a.checked_in).length;
      const notCheckedIn = attendees.length - checkedIn;

      const genderDistribution: Record<string, number> = {};
      const organizationDistribution: Record<string, number> = {};
      const registrationSourceDistribution: Record<string, number> = {};
      const checkInsByHour: Record<string, number> = {};

      attendees.forEach(attendee => {
        if (attendee.gender) {
          genderDistribution[attendee.gender] = (genderDistribution[attendee.gender] || 0) + 1;
        }

        if (attendee.organization) {
          organizationDistribution[attendee.organization] = (organizationDistribution[attendee.organization] || 0) + 1;
        }

        if (attendee.registration_source) {
          registrationSourceDistribution[attendee.registration_source] = (registrationSourceDistribution[attendee.registration_source] || 0) + 1;
        }

        if (attendee.checked_in_at) {
          const hour = new Date(attendee.checked_in_at).getHours();
          const hourLabel = `${hour}:00`;
          checkInsByHour[hourLabel] = (checkInsByHour[hourLabel] || 0) + 1;
        }
      });

      setReportData({
        totalAttendees: attendees.length,
        checkedIn,
        notCheckedIn,
        checkInRate: attendees.length > 0 ? (checkedIn / attendees.length) * 100 : 0,
        genderDistribution,
        organizationDistribution,
        registrationSourceDistribution,
        checkInsByHour,
        attendees,
      });
    }
    setLoading(false);
  };

  const drawPieChart = (canvas: HTMLCanvasElement, data: Record<string, number>, title: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2 + 20;
    const radius = Math.min(width, height) / 3;

    ctx.clearRect(0, 0, width, height);

    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', centerX, centerY);
      return;
    }

    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
    ];

    let startAngle = -Math.PI / 2;
    const entries = Object.entries(data);

    entries.forEach(([label, value], index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;

      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, centerX, 20);

    let legendY = height - (entries.length * 25) - 10;
    entries.forEach(([label, value], index) => {
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(20, legendY, 15, 15);

      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      const percentage = ((value / total) * 100).toFixed(1);
      ctx.fillText(`${label}: ${value} (${percentage}%)`, 40, legendY + 12);

      legendY += 25;
    });
  };

  useEffect(() => {
    if (reportData && !loading) {
      const genderCanvas = document.getElementById('gender-chart') as HTMLCanvasElement;
      const sourceCanvas = document.getElementById('source-chart') as HTMLCanvasElement;
      const checkInCanvas = document.getElementById('checkin-chart') as HTMLCanvasElement;
      const genderCanvasPrint = document.getElementById('gender-chart-print') as HTMLCanvasElement;
      const sourceCanvasPrint = document.getElementById('source-chart-print') as HTMLCanvasElement;
      const checkInCanvasPrint = document.getElementById('checkin-chart-print') as HTMLCanvasElement;

      if (genderCanvas) {
        drawPieChart(genderCanvas, reportData.genderDistribution, 'Gender Distribution');
      }
      if (sourceCanvas) {
        drawPieChart(sourceCanvas, reportData.registrationSourceDistribution, 'Registration Source');
      }
      if (checkInCanvas) {
        drawPieChart(checkInCanvas, {
          'Checked In': reportData.checkedIn,
          'Not Checked In': reportData.notCheckedIn
        }, 'Check-In Status');
      }

      if (genderCanvasPrint) {
        drawPieChart(genderCanvasPrint, reportData.genderDistribution, 'Gender Distribution');
      }
      if (sourceCanvasPrint) {
        drawPieChart(sourceCanvasPrint, reportData.registrationSourceDistribution, 'Registration Source');
      }
      if (checkInCanvasPrint) {
        drawPieChart(checkInCanvasPrint, {
          'Checked In': reportData.checkedIn,
          'Not Checked In': reportData.notCheckedIn
        }, 'Check-In Status');
      }
    }
  }, [reportData, loading]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    handlePrint();
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const csv = [
      ['Event Report: ' + event.name],
      ['Generated on: ' + new Date().toLocaleString()],
      [''],
      ['Summary Statistics'],
      ['Total Attendees', reportData.totalAttendees],
      ['Checked In', reportData.checkedIn],
      ['Not Checked In', reportData.notCheckedIn],
      ['Check-In Rate', `${reportData.checkInRate.toFixed(1)}%`],
      [''],
      ['Gender Distribution'],
      ...Object.entries(reportData.genderDistribution).map(([gender, count]) => [gender, count]),
      [''],
      ['Registration Source Distribution'],
      ...Object.entries(reportData.registrationSourceDistribution).map(([source, count]) => [source, count]),
      [''],
      ['Top Organizations'],
      ...Object.entries(reportData.organizationDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topOrgLimit)
        .map(([org, count]) => [org, count]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center text-slate-600">Loading report data...</div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
        <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
            <div>
              <h2 className="text-3xl font-bold mb-1">Event Report</h2>
              <p className="text-blue-100">{event.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Download size={20} />
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Printer size={20} />
                Print/PDF
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          <div ref={reportRef} className="p-8">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-blue-600" size={24} />
                <h3 className="text-2xl font-bold text-slate-900">Event Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 rounded-xl p-6">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Event Date</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {new Date(event.event_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Location</p>
                  <p className="text-lg font-semibold text-slate-900">{event.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Report Generated</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-green-600" size={24} />
                <h3 className="text-2xl font-bold text-slate-900">Key Metrics</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <Users size={24} className="text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-blue-900 font-medium mb-1">Total Attendees</p>
                  <p className="text-4xl font-bold text-blue-900">{reportData.totalAttendees}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-green-600 p-3 rounded-lg">
                      <CheckCircle2 size={24} className="text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-green-900 font-medium mb-1">Checked In</p>
                  <p className="text-4xl font-bold text-green-900">{reportData.checkedIn}</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-red-600 p-3 rounded-lg">
                      <Users size={24} className="text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-red-900 font-medium mb-1">Not Checked In</p>
                  <p className="text-4xl font-bold text-red-900">{reportData.notCheckedIn}</p>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-6 border-2 border-violet-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-violet-600 p-3 rounded-lg">
                      <TrendingUp size={24} className="text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-violet-900 font-medium mb-1">Check-In Rate</p>
                  <p className="text-4xl font-bold text-violet-900">{reportData.checkInRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Visual Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
                  <canvas id="gender-chart" width="300" height="350"></canvas>
                </div>
                <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
                  <canvas id="source-chart" width="300" height="350"></canvas>
                </div>
                <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
                  <canvas id="checkin-chart" width="300" height="350"></canvas>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-slate-900">Top Organizations</h3>
                <select
                  value={topOrgLimit}
                  onChange={(e) => setTopOrgLimit(Number(e.target.value))}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                  <option value={30}>Top 30</option>
                </select>
              </div>
              <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
                <div className="space-y-3">
                  {Object.entries(reportData.organizationDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, topOrgLimit)
                    .map(([org, count], index) => {
                      const percentage = (count / reportData.totalAttendees) * 100;
                      return (
                        <div key={org} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-900">{org || 'Not specified'}</span>
                              <span className="text-sm text-slate-600">{count} attendees ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {Object.keys(reportData.checkInsByHour).length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Check-In Timeline</h3>
                <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
                  <div className="space-y-2">
                    {Object.entries(reportData.checkInsByHour)
                      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                      .map(([hour, count]) => {
                        const maxCount = Math.max(...Object.values(reportData.checkInsByHour));
                        const percentage = (count / maxCount) * 100;
                        return (
                          <div key={hour} className="flex items-center gap-4">
                            <span className="w-16 text-sm font-medium text-slate-600">{hour}</span>
                            <div className="flex-1">
                              <div className="w-full bg-slate-200 rounded-full h-8 relative">
                                <div
                                  className="bg-green-600 h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                                  style={{ width: `${percentage}%` }}
                                >
                                  <span className="text-white font-semibold text-sm">{count}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            <div className="text-center pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-500">Report generated by Asterixify Event System</p>
              <p className="text-xs text-slate-400 mt-1">© 2025 Asterixify Innovations Africa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden print:block print:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Event Report: {event.name}</h1>
          <p className="text-slate-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Summary Statistics</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="border-2 border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Total Attendees</p>
              <p className="text-3xl font-bold text-slate-900">{reportData.totalAttendees}</p>
            </div>
            <div className="border-2 border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Checked In</p>
              <p className="text-3xl font-bold text-slate-900">{reportData.checkedIn}</p>
            </div>
            <div className="border-2 border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Not Checked In</p>
              <p className="text-3xl font-bold text-slate-900">{reportData.notCheckedIn}</p>
            </div>
            <div className="border-2 border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Check-In Rate</p>
              <p className="text-3xl font-bold text-slate-900">{reportData.checkInRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Visual Analytics</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="border-2 border-slate-200 rounded-lg p-4">
              <canvas id="gender-chart-print" width="300" height="350"></canvas>
            </div>
            <div className="border-2 border-slate-200 rounded-lg p-4">
              <canvas id="source-chart-print" width="300" height="350"></canvas>
            </div>
            <div className="border-2 border-slate-200 rounded-lg p-4">
              <canvas id="checkin-chart-print" width="300" height="350"></canvas>
            </div>
          </div>
        </div>

        <div className="mb-8 page-break-after">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Distribution Breakdowns</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Gender</h3>
              <ul className="space-y-1">
                {Object.entries(reportData.genderDistribution).map(([gender, count]) => (
                  <li key={gender} className="text-sm">
                    {gender}: {count} ({((count / reportData.totalAttendees) * 100).toFixed(1)}%)
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Registration Source</h3>
              <ul className="space-y-1">
                {Object.entries(reportData.registrationSourceDistribution).map(([source, count]) => (
                  <li key={source} className="text-sm">
                    {source}: {count} ({((count / reportData.totalAttendees) * 100).toFixed(1)}%)
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Top Organizations</h3>
              <ul className="space-y-1">
                {Object.entries(reportData.organizationDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([org, count]) => (
                    <li key={org} className="text-sm">
                      {org || 'Not specified'}: {count}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
