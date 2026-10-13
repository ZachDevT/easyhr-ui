"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Network, Plus, Minus, Search, ZoomIn, ZoomOut, Maximize, Building, MapPin, Users, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";

interface OrgEmployee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  manager?: string;
  managerId?: string;
  avatar?: string;
  status?: string;
}

const treeStyles = `
.org-tree ul {
  padding-top: 30px; 
  position: relative;
  transition: all 0.5s;
  display: flex;
  justify-content: center;
}
.org-tree li {
  float: left; text-align: center;
  list-style-type: none;
  position: relative;
  padding: 30px 15px 0 15px;
  transition: all 0.5s;
}
.org-tree li::before, .org-tree li::after {
  content: '';
  position: absolute; top: 0; right: 50%;
  border-top: 2px solid var(--border);
  width: 50%; height: 30px;
}
.org-tree li::after {
  right: auto; left: 50%;
  border-left: 2px solid var(--border);
}
.org-tree li:only-child::after, .org-tree li:only-child::before {
  display: none;
}
.org-tree li:only-child { padding-top: 0;}
.org-tree li:first-child::before, .org-tree li:last-child::after {
  border: 0 none;
}
.org-tree li:last-child::before {
  border-right: 2px solid var(--border);
  border-radius: 0 6px 0 0;
}
.org-tree li:first-child::after {
  border-radius: 6px 0 0 0;
}
.org-tree ul ul::before {
  content: '';
  position: absolute; top: 0; left: 50%;
  border-left: 2px solid var(--border);
  width: 0; height: 30px;
}
.org-node-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: white;
  padding: 0;
  display: inline-flex;
  flex-direction: column;
  min-width: 250px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  position: relative;
  text-align: left;
  overflow: hidden;
}
.org-node-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(162, 56, 255, 0.15);
  z-index: 10;
}
.org-node-card.highlighted {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-tint);
}
`;

function OrgNode({
  employee,
  allEmployees,
  searchQuery,
}: {
  employee: OrgEmployee;
  allEmployees: OrgEmployee[];
  searchQuery: string;
}) {
  const fullName = `${employee.firstName} ${employee.lastName}`.trim();
  const directReports = useMemo(() => {
    return allEmployees.filter((e) => {
      if (e.id === employee.id) return false;
      if (e.managerId && e.managerId === employee.id) return true;
      if (e.manager && e.manager.trim().toLowerCase() === fullName.toLowerCase()) return true;
      return false;
    });
  }, [allEmployees, employee.id, fullName]);

  const [expanded, setExpanded] = useState(true);

  const isMatched = searchQuery
    ? fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.department || "").toLowerCase().includes(searchQuery.toLowerCase())
    : false;

  return (
    <li>
      <div className={`org-node-card ${isMatched ? "highlighted" : ""}`}>
        <div style={{ height: 4, background: "var(--gradient)", width: "100%" }} />

        <div style={{ padding: "18px 22px" }}>
          <div className="row gap-14 mb-14 align-center">
            <Avatar src={employee.avatar} name={fullName} size="lg" />
            <div>
              <div className="text-sm fw-800 text-1">{fullName}</div>
              <div className="text-xs fw-600 text-primary mt-2">
                {employee.jobTitle || "Team Member"}
              </div>
            </div>
          </div>

          <div className="divider my-10" style={{ margin: "12px -22px", background: "var(--bg-page)" }} />

          <div className="row-between text-xs text-5 mb-6">
            <div className="row gap-6 align-center">
              <Building size={13} /> {employee.department || "General"}
            </div>
          </div>
          <div className="row-between text-xs text-5">
            <div className="row gap-6 align-center">
              <MapPin size={13} /> {employee.location || "Remote"}
            </div>
          </div>
        </div>

        {directReports.length > 0 && (
          <div
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "#F9FAFB",
              padding: "10px 22px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-tint)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F9FAFB")}
          >
            <div className="row gap-6 text-xs fw-700 text-1 align-center">
              <Users size={13} className="text-primary" /> {directReports.length} Direct Report{directReports.length > 1 ? "s" : ""}
            </div>
            {expanded ? <Minus size={13} className="text-5" /> : <Plus size={13} className="text-5" />}
          </div>
        )}
      </div>

      {directReports.length > 0 && expanded && (
        <ul>
          {directReports.map((report) => (
            <OrgNode
              key={report.id}
              employee={report}
              allEmployees={allEmployees}
              searchQuery={searchQuery}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrgChartPage() {
  const { getToken } = useAuth();
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [search, setSearch] = useState("");

  const fetchEmployees = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setEmployees(list);
      }
    } catch (err) {
      console.error("Failed to fetch employees for org chart", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Identify root employees (anyone without an active manager or whose manager is not in the list)
  const rootEmployees = useMemo(() => {
    if (!employees.length) return [];
    const empIds = new Set(employees.map((e) => e.id));
    const empNames = new Set(employees.map((e) => `${e.firstName} ${e.lastName}`.trim().toLowerCase()));

    const roots = employees.filter((e) => {
      if (!e.managerId && (!e.manager || e.manager === "No manager assigned")) {
        return true;
      }
      if (e.managerId && !empIds.has(e.managerId)) {
        return true;
      }
      if (e.manager && !empNames.has(e.manager.trim().toLowerCase())) {
        return true;
      }
      return false;
    });

    // If cyclical or all have managers somehow, pick the earliest created employee as root
    return roots.length > 0 ? roots : [employees[0]];
  }, [employees]);

  return (
    <div className="page-container" style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}>
      <style>{treeStyles}</style>

      <div
        className="row-between"
        style={{
          padding: "24px 32px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-page)",
          flexShrink: 0,
        }}
      >
        <div>
          <h1 className="page-title text-primary m-0 flex items-center gap-10" style={{ fontSize: 22, fontWeight: 700 }}>
            <Network size={22} /> Organization Chart
          </h1>
          <p className="text-xs text-4 mt-4">Navigate your organization reporting hierarchy in real time.</p>
        </div>

        {/* Toolbar */}
        <div className="row gap-14 align-center">
          <div
            className="search-bar"
            style={{
              display: "flex",
              alignItems: "center",
              background: "white",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 14px",
              width: 240,
            }}
          >
            <Search size={15} className="text-4" style={{ marginRight: 8 }} />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: "100%" }}
            />
          </div>

          <div className="row" style={{ background: "white", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            <button
              className="btn-circle"
              style={{ border: "none", borderRadius: 0, width: 38, height: 38, borderRight: "1px solid var(--border)", cursor: "pointer" }}
              onClick={() => setZoom(Math.max(50, zoom - 10))}
            >
              <ZoomOut size={15} />
            </button>
            <div style={{ width: 56, textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--text-1)", lineHeight: "38px" }}>
              {zoom}%
            </div>
            <button
              className="btn-circle"
              style={{ border: "none", borderRadius: 0, width: 38, height: 38, borderLeft: "1px solid var(--border)", cursor: "pointer" }}
              onClick={() => setZoom(Math.min(150, zoom + 10))}
            >
              <ZoomIn size={15} />
            </button>
          </div>

          <button
            className="btn-secondary"
            style={{ background: "white", padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}
            onClick={() => setZoom(100)}
          >
            <Maximize size={15} /> Reset
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", background: "#F8F9FA", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "radial-gradient(var(--border) 1px, transparent 0)",
            backgroundSize: "24px 24px",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
            <Loader2 className="animate-spin text-primary" size={36} />
          </div>
        ) : employees.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "60vh", textAlign: "center" }}>
            <Users size={40} className="text-4 mb-12" />
            <h3 className="text-lg fw-700 text-1">No employees in directory</h3>
            <p className="text-sm text-4 mt-4">Add your team members to visualize the organizational chart.</p>
          </div>
        ) : (
          <div
            style={{
              minWidth: "max-content",
              padding: "60px 80px",
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease",
            }}
          >
            <div className="org-tree">
              <ul>
                {rootEmployees.map((root) => (
                  <OrgNode
                    key={root.id}
                    employee={root}
                    allEmployees={employees}
                    searchQuery={search}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
