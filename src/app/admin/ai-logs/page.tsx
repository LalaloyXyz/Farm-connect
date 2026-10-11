"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, AlertTriangle } from "lucide-react"

export default function AdminServerLogsPage() {
  const [logs, setLogs] = useState<string[]>([]); const [loading, setLoading] = useState(true)
  const [error, setError] = useState(""); const [autoRefresh, setAutoRefresh] = useState(true)

  async function fetchLogs() {
    try {
      const res = await fetch("/api/admin/logs")
      const d = await res.json()
      if (d.success) { setLogs(d.data); setError("") }
      else setError(d.message)
    } catch { setError("ไม่สามารถโหลด logs ได้") }
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Server Logs</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="accent-green-600" />
            Auto-refresh
          </label>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh
          </Button>
        </div>
      </div>

      {loading ? <Skeleton className="h-60" /> : error ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Next.js Dev Logs (ล่าสุด {logs.length} รายการ)</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-xs leading-relaxed overflow-x-auto" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {logs.length === 0 ? (
                <span className="text-gray-500">ไม่มี logs</span>
              ) : (
                logs.map((line, i) => (
                  <div key={i} className={`whitespace-pre-wrap ${
                    /error|Error|ERR|❌|exit|Fail|fail/i.test(line) ? "text-red-400" :
                    /WARNING|WARN|warn|⚠️/i.test(line) ? "text-yellow-300" :
                    /GET\s+\/\d{3}\s+200|success|✅|Compiled|ready/i.test(line) ? "text-green-300" :
                    /GET|POST|PUT|DELETE|PATCH/i.test(line) ? "text-blue-300" :
                    /\d{3}\s+ms|waiting|wait/i.test(line) ? "text-yellow-400" :
                    /react|hydrat|Hydrat/i.test(line) ? "text-orange-300" :
                    ""
                  }`}>
                    {line.replace(/\[36m/g, "").replace(/\[39m/g, "").replace(/\[32m/g, "").replace(/\[31m/g, "").replace(/\[90m/g, "").replace(/\[2m/g, "").replace(/\[22m/g, "")}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
