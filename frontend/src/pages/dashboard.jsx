import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [newsFilter, setNewsFilter] = useState("all");
  const [profilesFilter, setProfilesFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const vipId = localStorage.getItem("vipId");
  const navigate = useNavigate();

  useEffect(() => {
    if (!vipId) return;

    const fetchData = async () => {
      try {
        const postsRes = await fetch(
          `http://localhost:5000/api/posts?vipId=${vipId}`
        );
        let postsData = await postsRes.json();

        // ✅ Normalize flagStatus: only "ok" counts as ok
        postsData = postsData.map((p) => ({
          ...p,
          flagStatus: p.flagStatus === "ok" ? "ok" : "flagged",
        }));
        setPosts(postsData);

        const profilesRes = await fetch(
          `http://localhost:5000/api/flagged-profiles?vipId=${vipId}`
        );
        const profilesData = await profilesRes.json();
        setProfiles(profilesData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchData();
  }, [vipId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleMyAccount = () => {
    navigate("/myacc");
  };

  const handleReport = (type, id) => {
    console.log(`Reported ${type} with ID:`, id);
    alert("Thanks for reporting! We'll review this case.");
  };

  const filterByDate = (items) => {
    if (dateFilter === "all") return items;
    const now = new Date();
    return items.filter((item) => {
      const date = new Date(item.createdAt || item.updatedAt || Date.now());
      if (dateFilter === "24h") return now - date <= 24 * 60 * 60 * 1000;
      if (dateFilter === "7d") return now - date <= 7 * 24 * 60 * 60 * 1000;
      return true;
    });
  };

  const filteredNews = filterByDate(
    posts.filter((item) => {
      if (newsFilter === "flagged") return item.flagStatus === "flagged";
      if (newsFilter === "ok") return item.flagStatus === "ok";
      return true;
    })
  );

  const filteredProfiles = filterByDate(
    profiles.filter((item) => {
      if (profilesFilter === "flagged") return item.flaggedPostIds.length > 0;
      if (profilesFilter === "ok") return item.flaggedPostIds.length === 0;
      return true;
    })
  );

  const groupByDate = () => {
    const map = {};
    posts.forEach((p) => {
      const date = new Date(p.createdAt || Date.now())
        .toISOString()
        .split("T")[0];
      if (!map[date]) map[date] = { date, flagged: 0, ok: 0 };
      if (p.flagStatus === "ok") map[date].ok += 1;
      else map[date].flagged += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  };

  const lineData = groupByDate();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-6 font-sans">
      {/* --- HEADER --- */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 p-4 bg-white rounded-2xl shadow">
        <h1 className="text-3xl font-extrabold">Dashboard</h1>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <span className="text-neutral-600 text-sm">
            User ID: <span className="font-mono text-xs">{vipId || "VIP Monitor"}</span>
          </span>
          <button
            onClick={handleMyAccount}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            My Account
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg shadow hover:bg-neutral-900 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* --- GRID LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- POSTS --- */}
        <section className="lg:col-span-2 bg-white p-6 rounded-2xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">News Feed</h2>
            <div className="flex space-x-2">
              {["all", "flagged", "ok"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setNewsFilter(filter)}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    newsFilter === filter
                      ? filter === "flagged"
                        ? "bg-red-500 text-white"
                        : "bg-green-500 text-white"
                      : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-2 mb-4">
            {["all", "24h", "7d"].map((df) => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-3 py-1 text-xs rounded-full transition ${
                  dateFilter === df
                    ? "bg-neutral-800 text-white"
                    : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {df.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {filteredNews.length === 0 ? (
              <p className="text-center text-neutral-500 mt-4">
                Nothing flagged yet.
              </p>
            ) : (
              filteredNews.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 rounded-xl border relative ${
                    item.flagStatus === "flagged"
                      ? "bg-red-50 border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{item.content}</h3>
                    <div className="flex items-center space-x-2">
                      {item.flagStatus === "flagged" && (
                        <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-200 rounded-full">
                          Flagged
                        </span>
                      )}
                      <button
                        onClick={() => handleReport("post", item._id)}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Report misclassification"
                      >
                        ⚠️
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 mt-2">
                    Posted by: <span className="font-bold">{item.username}</span>
                  </p>
                  <p className="text-sm text-neutral-600">
                    Source:{" "}
                    <a
                      href={item.linkToPost}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {item.linkToPost}
                    </a>
                  </p>
                  {item.flagStatus === "flagged" && item.flagReasons?.length > 0 && (
                    <p className="text-sm text-red-500 mt-1">
                      Reason: {item.flagReasons.join(", ")}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* --- ANALYTICS + PROFILES --- */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-2xl font-bold mb-4">Safety Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ok"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="OK Posts"
                />
                <Line
                  type="monotone"
                  dataKey="flagged"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Flagged Posts"
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Profiles</h2>
              <div className="flex space-x-2">
                {["all", "flagged", "ok"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setProfilesFilter(filter)}
                    className={`px-3 py-1 text-sm rounded-full transition ${
                      profilesFilter === filter
                        ? filter === "flagged"
                          ? "bg-red-500 text-white"
                          : "bg-green-500 text-white"
                        : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    {filter.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-2 mb-4">
              {["all", "24h", "7d"].map((df) => (
                <button
                  key={df}
                  onClick={() => setDateFilter(df)}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    dateFilter === df
                      ? "bg-neutral-800 text-white"
                      : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {df.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
              {filteredProfiles.length === 0 ? (
                <p className="text-center text-neutral-500 mt-4">
                  No flagged profiles found.
                </p>
              ) : (
                filteredProfiles.map((profile) => (
                  <div
                    key={profile._id}
                    className={`p-4 rounded-xl border relative ${
                      profile.flaggedPostIds.length > 0
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{profile.username}</h3>
                      <div className="flex items-center space-x-2">
                        {profile.flaggedPostIds.length > 0 && (
                          <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-200 rounded-full">
                            Flagged
                          </span>
                        )}
                        <button
                          onClick={() => handleReport("profile", profile._id)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Report misclassification"
                        >
                          ⚠️
                        </button>
                      </div>
                    </div>
                    {profile.flaggedPostIds.length > 0 && (
                      <p className="text-sm text-red-500 mt-1">
                        Flagged Posts: {profile.flaggedPostIds.join(", ")}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
