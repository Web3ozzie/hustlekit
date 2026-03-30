"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { auth, db, storage } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function HustleKitPage() {
  const [user, setUser] = useState<{
  uid: string;
  username: string;
  hustleId: string;
  email: string | null;
  hasToolsSub?: boolean;
} | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      const refUser = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(refUser);
      const data = snap.data() as any;
setUser({
  uid: firebaseUser.uid,
  username:
    data?.username ||
    firebaseUser.displayName ||
    firebaseUser.email?.split("@")[0] ||
    "Hustler",
  hustleId: data?.hustleId || "HK-XXXXXX",
  email: firebaseUser.email ?? null,
  hasToolsSub: data?.hasToolsSub ?? false,
});
    });

    return () => unsub();
  }, []);

  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<
    "investments" | "jobs" | "tools" | "chat" | "profile"
  >("investments");

  useEffect(() => {
    if (!tabFromUrl) return;
    if (["investments", "jobs", "tools", "chat", "profile"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl as any);
    }
  }, [tabFromUrl]);

async function startToolsSub() {
  if (!user?.uid || !user.email) {
    alert("Please log in with an email account first.");
    return;
  }

  try {
    const res = await fetch("/api/ai/subscribe-tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.uid,
        email: user.email,
      }),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      console.error("Response not JSON");
    }

    console.log("SUBSCRIBE RES:", res.status, data);

   if (!res.ok || !data?.link) {
  alert(data?.error || "Could not start payment. Please try again.");
  return;
}
    window.location.href = data.link;
  } catch (err) {
    console.error(err);
    alert("Network error. Please try again.");
  }
}
  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-gray-900 p-4 md:p-5 flex md:block overflow-x-auto md:overflow-visible">
        <h1 className="text-xl md:text-2xl font-bold">
          <span className="text-white">Hustle</span>
          <span className="text-orange-400">Kit</span>
        </h1>

        <ul className="mt-4 md:mt-6 flex md:block gap-4 md:gap-0 text-sm md:text-base">
          <li
            onClick={() => setActiveTab("investments")}
            className="cursor-pointer hover:text-orange-400"
          >
            Investments
          </li>
          <li
            onClick={() => setActiveTab("jobs")}
            className="cursor-pointer hover:text-orange-400"
          >
            Jobs
          </li>
          <li
            onClick={() => setActiveTab("tools")}
            className="cursor-pointer hover:text-orange-400"
          >
            Tools
          </li>
          <li
            onClick={() => setActiveTab("chat")}
            className="cursor-pointer hover:text-orange-400"
          >
            Chat
          </li>
          <li
            onClick={() => setActiveTab("profile")}
            className="cursor-pointer hover:text-orange-400"
          >
            Profile
          </li>
        </ul>
      </div>

      {/* Main Content */}
<div className="flex-1 p-4 md:p-6">
  {activeTab === "investments" && (
    <Investments
      myHustleId={user?.hustleId}
      openChatTab={() => setActiveTab("chat")}
    />
  )}

  {activeTab === "jobs" && <Jobs />}

 {activeTab === "tools" && (
  user?.hasToolsSub ? (
    <Tools />
  ) : (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Unlock HustleKit Tools</h2>
      <p className="text-sm text-gray-400">
        Get access to writing tools, CV, invoice, letter  and more to support your hustles.
      </p>
      <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
        <li>CV and bio builder</li>
        <li>Letter and pitch writer</li>
        <li>Saved templates for quick reuse</li>
        <li>Profit calculator</li>
<li>Invoices for your business</li>
      </ul>
      <p className="text-sm text-gray-400">
        ₦1,500 per month. Various payment options.
      </p>
      <button
        onClick={startToolsSub}
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-semibold"
      >
        Get Access
      </button>
    </div>
  )
)}

  {activeTab === "chat" && <Chat myHustleId={user?.hustleId} />}

  {activeTab === "profile" && user && <Profile user={user} />}
  {activeTab === "profile" && !user && <div>Loading...</div>}
</div>
</div>
);
}

type InvestmentsProps = {
  myHustleId?: string;
  openChatTab?: () => void;
};

function Investments({ myHustleId, openChatTab }: InvestmentsProps) {
  const [coins, setCoins] = React.useState<any[]>([]);
  const [category, setCategory] = React.useState("crypto");
  const [stocksData, setStocksData] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editPrice, setEditPrice] = React.useState("");
  const [newLocation, setNewLocation] = React.useState("");
  const [newContact, setNewContact] = React.useState("");
  const [properties, setProperties] = React.useState<any[]>([]);
  const [newName, setNewName] = React.useState("");
  const [newPrice, setNewPrice] = React.useState("");
  const [chatTargetId, setChatTargetId] = React.useState("");
  const [newCurrency, setNewCurrency] = React.useState("USD");

  const myId = myHustleId || "HK-ANON";

  // load properties
  React.useEffect(() => {
    async function fetchProperties() {
      const querySnapshot = await getDocs(collection(db, "properties"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProperties(data as any[]);
    }
    fetchProperties();
  }, []);

  // crypto
  React.useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd")
      .then((res) => res.json())
      .then((data) => setCoins(data.slice(0, 10)));
  }, []);

  // stocks
  React.useEffect(() => {
    const symbols = ["AAPL", "TSLA"];

    Promise.all(
      symbols.map((symbol) =>
        fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=Z81CNPMN75WXNHZO`
        ).then((res) => res.json())
      )
    ).then((results) => {
      const formatted = results.map((res, i) => {
        const data = res["Global Quote"];
        return {
          name: symbols[i],
          price: data?.["05. price"] || "N/A",
          change: data?.["10. change percent"] || "0%",
        };
      });

      setStocksData(formatted);
    });
  }, []);

  React.useEffect(() => {
    localStorage.setItem("properties", JSON.stringify(properties));
  }, [properties]);

  async function addProperty() {
    if (!newName || !newPrice) {
      alert("Fill name and price");
      return;
    }

    const newProperty = {
      name: newName,
      price: newPrice,
      location: newLocation,
      contact: newContact,
      ownerId: myId,
      currency: newCurrency,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "properties"), newProperty);

      const querySnapshot = await getDocs(collection(db, "properties"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProperties(data as any[]);

      setNewName("");
      setNewPrice("");
      setNewLocation("");
      setNewContact("");
      setShowForm(false);

      toast.success("Property added!");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while adding the property");
    }
  }

  async function deleteProperty(id: string) {
    await deleteDoc(doc(db, "properties", id));
    setProperties((prev) => prev.filter((item) => item.id !== id));
  }

  function startEdit(index: number) {
    const item = properties[index];
    setEditingIndex(index);
    setEditName(item.name);
    setEditPrice(item.price);
  }

  async function saveEdit() {
    if (editingIndex === null) return;

    const item = properties[editingIndex];
    const ref = doc(db, "properties", item.id);

    await updateDoc(ref, {
      name: editName,
      price: editPrice,
    });

    const querySnapshot = await getDocs(collection(db, "properties"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setProperties(data as any[]);
    setEditingIndex(null);
  }

  function openChatWith(hustleId: string) {
    setChatTargetId(hustleId);
    openChatTab?.();
  }

  const goldAssets = [
    { name: "Gold (1oz)", price: 2300, change: 0.3 },
    { name: "Silver (1oz)", price: 28, change: -0.2 },
  ];

  return (
    <div>
      {/* TITLE */}
      <h2 className="text-2xl font-semibold mb-4">
        {category === "crypto" && "Digital Assets"}
        {category === "stocks" && " Equities"}
        {category === "gold" && " Hard Assets"}
        {category === "realestate" && " Real Estate"}
      </h2>

      {/* TABS */}
      <div className="flex gap-3 mb-6 text-sm">
        <button
          onClick={() => setCategory("crypto")}
          className={`px-3 py-1 rounded ${
            category === "crypto"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-300"
          }`}
        >
          Digital
        </button>
        <button
          onClick={() => setCategory("stocks")}
          className={`px-3 py-1 rounded ${
            category === "stocks"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-300"
          }`}
        >
          Equities
        </button>
        <button
          onClick={() => setCategory("gold")}
          className={`px-3 py-1 rounded ${
            category === "gold"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-300"
          }`}
        >
          Hard Assets
        </button>
        <button
          onClick={() => setCategory("realestate")}
          className={`px-3 py-1 rounded ${
            category === "realestate"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-300"
          }`}
        >
          Real Estate
        </button>
      </div>

      {/* REAL ESTATE FORM + TOGGLE */}
      {category === "realestate" && (
        <>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition font-semibold mb-4 text-sm"
          >
            {showForm ? "✖ Cancel" : "➕ Add Property"}
          </button>

          {showForm && (
            <div className="mb-6 space-y-3 bg-gray-900/70 p-4 rounded-xl border border-gray-800">
              <input
                type="text"
                placeholder="Property name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-sm"
              />

              <input
                type="number"
                placeholder="Price"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-sm"
              />

              <select
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="NGN">NGN (₦)</option>
                <option value="EUR">EUR (€)</option>
              </select>

              <input
                type="text"
                placeholder="Location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-sm"
              />

              <input
                type="text"
                placeholder="Contact"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-sm"
              />

              <button
                onClick={addProperty}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition font-semibold w-full text-sm"
              >
                Save Property
              </button>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* DIGITAL ASSETS */}
        {category === "crypto" &&
          coins.map((coin: any) => (
            <div
              key={coin.id}
              className="bg-gray-900/70 backdrop-blur-lg p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-gray-300">{coin.name}</h3>
                <p className="text-white font-semibold">
                  ${coin.current_price}
                </p>
              </div>

              <p
                className={`mt-2 ${
                  coin.price_change_percentage_24h > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {coin.price_change_percentage_24h.toFixed(2)}%
              </p>
            </div>
          ))}

        {/* STOCKS */}
        {category === "stocks" &&
          stocksData.map((item: any, index: number) => (
            <div
              key={index}
              className="bg-gray-900/70 backdrop-blur-lg p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-gray-300">{item.name}</h3>
                <p className="text-white font-semibold">${item.price}</p>
              </div>
              <p
                className={
                  item.change && item.change.includes("-")
                    ? "text-red-400"
                    : "text-green-400"
                }
              >
                {item.change}
              </p>
            </div>
          ))}

        {/* GOLD */}
        {category === "gold" &&
          goldAssets.map((item, index) => (
            <div
              key={index}
              className="bg-gray-900/70 backdrop-blur-lg p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-gray-300">{item.name}</h3>
                <p className="text-white font-semibold">${item.price}</p>
              </div>
              <p
                className={
                  item.change > 0 ? "text-green-400" : "text-red-400"
                }
              >
                {item.change}%
              </p>
            </div>
          ))}

        {/* REAL ESTATE LIST */}
        {category === "realestate" &&
          properties.map((item, index) => (
            <div
              key={item.id ?? index}
              className="bg-gray-900/70 backdrop-blur-lg p-4 rounded-2xl border border-gray-800 hover;border-gray-700 transition"
            >
              {editingIndex === index ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full mb-2 p-2 bg-gray-800 rounded text-sm"
                  />

                  <input
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full mb-2 p-2 bg-gray-800 rounded text-sm"
                  />

                  <button
                    onClick={saveEdit}
                    className="bg-green-500 px-3 py-1 rounded mr-2 text-xs"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-300">{item.name}</h3>
                    <p className="text-white font-semibold">
                      {(item.currency === "NGN" && "₦") ||
                        (item.currency === "EUR" && "€") ||
                        "$"}
                      {item.price}
                    </p>
                  </div>

                  <p className="text-sm text-gray-400 mt-1">
                    Posted by{" "}
                    <span className="font-mono text-orange-300">
                      {item.ownerId || "HK-XXXXXX"}
                    </span>
                  </p>

                  <p className="text-sm text-gray-400 mt-2">
                    📍 {item.location}
                  </p>

                  <p className="text-sm text-gray-400">
                    📞 {item.contact}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    <a
                      href={
                        item.contact?.includes("@")
                          ? `mailto:${item.contact}`
                          : `tel:${item.contact}`
                      }
                      className={`px-3 py-1 rounded ${
                        item.contact
                          ? "bg-[#FF6B6B]"
                          : "bg-gray-600 cursor-not-allowed"
                      }`}
                    >
                      Contact
                    </a>

                    {item.ownerId && item.ownerId !== myId && (
                      <button
                        type="button"
                        onClick={() => openChatWith(item.ownerId)}
                        className="bg-green-600 px-3 py-1 rounded"
                      >
                        Message owner
                      </button>
                    )}

                    {item.ownerId === myId && (
                      <>
                        <button
                          onClick={() => startEdit(index)}
                          className="bg-yellow-500 px-3 py-1 rounded"
                        >
                          Edit
                        </button>

                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this property?"
                                )
                              ) {
                                deleteProperty(item.id);
                              }
                            }}
                            className="bg-red-600 px-3 py-1 rounded"
                          >
                            Delete
                          </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
      </div>

      {/* Later you can use chatTargetId to deep-link into Chat */}
      {/* <Chat myHustleId={myId} initialTargetId={chatTargetId} /> */}
    </div>
  );
}
function Jobs() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);

  // PUBLIC JOBS – everyone sees all
  React.useEffect(() => {
    async function fetchJobs() {
      const querySnapshot = await getDocs(collection(db, "jobs"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(data);
    }
    fetchJobs();
  }, []);

  async function addJob() {
    if (!title || !company) {
      alert("Fill all fields");
      return;
    }

    const newJob = { title, company, location, contact };

    try {
      await addDoc(collection(db, "jobs"), newJob);

      const querySnapshot = await getDocs(collection(db, "jobs"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(data);

      setTitle("");
      setCompany("");
      setLocation("");
      setContact("");
      setShowForm(false);
      alert("Job added!");
    } catch (error) {
      console.error(error);
      alert("Error adding job");
    }
  }

  async function deleteJob(id: string) {
    await deleteDoc(doc(db, "jobs", id));
    setJobs((prev) => prev.filter((job) => job.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header + neutral description + button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Jobs Marketplace</h2>
         <p className="mt-1 text-xs text-gray-400">
  See open roles and gigs from across HustleKit.
</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 px-4 py-2 rounded-lg transition font-semibold text-sm w-full sm:w-auto"
        >
          {showForm ? "✖ Cancel" : "➕ Add Job"}
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="mb-4 space-y-3 bg-gray-900/70 p-4 rounded-xl border border-orange-500/30">
          <span className="inline-flex items-center text-[10px] uppercase tracking-wide text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded-full mb-1">
            New listing
          </span>

          <input
            type="text"
            placeholder="Job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            type="text"
            placeholder="Location (e.g. Lagos, Remote)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            type="text"
            placeholder="Contact (email or phone)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <button
            onClick={addJob}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition font-semibold w-full text-sm"
          >
            Save Job
          </button>
        </div>
      )}

      {/* JOB LIST – public */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            {jobs.length} job{jobs.length === 1 ? "" : "s"} live on HustleKit.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {jobs.map((job: any) => (
              <div
                key={job.id}
                className="bg-gray-900/80 backdrop-blur p-4 rounded-2xl border border-gray-800 hover:border-orange-500/60 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold">{job.title}</h3>
                    <p className="text-sm text-gray-300">{job.company}</p>
                  </div>
                  <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-orange-300">
                    HustleKit
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  📍 {job.location || "Location not set"}
                </p>
                {job.contact && (
                  <p className="mt-1 text-xs text-gray-500">{job.contact}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {job.contact && (
                    <a
                      href={
                        job.contact.includes("@")
                          ? `mailto:${job.contact}`
                          : `tel:${job.contact}`
                      }
                      className="rounded px-3 py-1 bg-green-600 hover:bg-green-700 text-xs font-semibold"
                    >
                      Apply
                    </a>
                  )}

                  <button
                    onClick={() => deleteJob(job.id)}
                    className="rounded border border-orange-500/60 px-3 py-1 text-xs font-semibold text-orange-300 hover:bg-orange-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function Tools() {
  const [activeTool, setActiveTool] = useState<
    "bio" | "letter" | "invoice" | "profit" | "pitch" | "cv"
  >("bio");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BIO
  const [bioInput, setBioInput] = useState("");
  const [generatedBio, setGeneratedBio] = useState("");

  // LETTER
  const [letterType, setLetterType] = useState("formal");
  const [toPerson, setToPerson] = useState("");
  const [fromPerson, setFromPerson] = useState("");
  const [letterBody, setLetterBody] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState("");

  // PROFIT
  const [cost, setCost] = useState("");
  const [selling, setSelling] = useState("");
  const [profit, setProfit] = useState<string | null>(null);

  // PITCH
  const [pitchType, setPitchType] = useState("sales");
  const [audienceType, setAudienceType] = useState("investors");
  const [textInput, setTextInput] = useState("");
  const [output, setOutput] = useState("");

  // CV
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("entry");
  const [skills, setSkills] = useState("");
  const [generatedCV, setGeneratedCV] = useState("");
  const [summary, setSummary] = useState("");
  const [experienceText, setExperienceText] = useState("");
  const [educationText, setEducationText] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [eduSchool, setEduSchool] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduYear, setEduYear] = useState("");
  const [eduSchool2, setEduSchool2] = useState("");
  const [eduQual2, setEduQual2] = useState("");
  const [eduYear2, setEduYear2] = useState("");
  const [expCompany1, setExpCompany1] = useState("");
  const [expRole1, setExpRole1] = useState("");
  const [expYear1, setExpYear1] = useState("");
  const [expDuties1, setExpDuties1] = useState("");
  const [expCompany2, setExpCompany2] = useState("");
  const [expRole2, setExpRole2] = useState("");
  const [expYear2, setExpYear2] = useState("");
  const [expDuties2, setExpDuties2] = useState("");

  // INVOICE
  const [invoiceType, setInvoiceType] = useState("service");
  const [invoiceStatus, setInvoiceStatus] = useState("paid");
  const [businessName, setBusinessName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState([{ description: "", qty: 1, price: "" }]);
  const [currency, setCurrency] = useState("USD");
  const currencies = [
    { code: "USD", label: "USD - US Dollar" },
    { code: "EUR", label: "EUR - Euro" },
    { code: "GBP", label: "GBP - British Pound" },
    { code: "NGN", label: "NGN - Nigerian Naira" },
  ];

  useEffect(() => {
    const savedCV = localStorage.getItem("hk_cv");
    const savedPitch = localStorage.getItem("hk_pitch");
    if (savedCV) setGeneratedCV(savedCV);
    if (savedPitch) setOutput(savedPitch);
  }, []);

  async function callAI(tool: string, payload: any) {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, payload }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();
      return data.text;
    } catch (e) {
      console.error(e);
      setError("AI failed, please try again.");
      return "";
    } finally {
      setLoading(false);
    }
  }

  // BIO
  async function generateBio() {
    if (!bioInput) return;
    const text = await callAI("bio", { bioInput });
    if (text) setGeneratedBio(text);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  }

  // LETTER
  async function generateLetter() {
    if (!toPerson || !fromPerson || !letterBody) return;

    const text = await callAI("letter", {
      letterType,
      toPerson,
      fromPerson,
      letterBody,
    });

    if (text) setGeneratedLetter(text);
  }

  function downloadLetter(text: string) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "letter.txt";
    a.click();

    URL.revokeObjectURL(url);
  }

  // PROFIT
  function calculateProfit() {
    if (!cost || !selling) return;
    const p = Number(selling) - Number(cost);
    setProfit(p.toFixed(2));
  }

  // PITCH
  async function generatePitch() {
    if (!textInput) return;

    const text = await callAI("pitch", {
      pitchType,
      audienceType,
      textInput,
    });

    if (text) {
      setOutput(text);
      localStorage.setItem("hk_pitch", text);
    }
  }

  // CV
  async function generateCV() {
    if (!skills && !summary && !experienceText && !educationText) return;

    const text = await callAI("cv", {
      jobType,
      experienceLevel,
      skills,
      summary,
      fullName,
      contactInfo,
      experienceText,
      educationText,
      eduSchool,
      eduDegree,
      eduYear,
      eduSchool2,
      eduQual2,
      eduYear2,
      expCompany1,
      expRole1,
      expYear1,
      expDuties1,
      expCompany2,
      expRole2,
      expYear2,
      expDuties2,
    });

    if (text) {
      setGeneratedCV(text);
      // localStorage.setItem("hk_cv", text);
    }
  }

  function generateCVCvPDF() {
    if (!generatedCV) return;

    const doc = new jsPDF();
    const margin = 20;
    const lineHeight = 6;
    let y = margin;

    const lines = generatedCV.split("\n");
    const [nameLine, addrLine, contactLine, ...rest] = lines;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(nameLine || fullName || "Full Name", margin, y);
    y += 6;

    if (addrLine) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(addrLine, margin, y);
      y += 5;
    }

    if (contactLine) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(contactLine, margin, y);
      y += 8;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const bodyLines = doc.splitTextToSize(rest.join("\n"), 170);
    bodyLines.forEach((line: string) => {
      if (y > 280) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    doc.save("cv.pdf");
  }

  function generatePDFInvoice() {
    const validItems = items.filter(
      (it) => it.description && Number(it.price) > 0 && Number(it.qty) > 0
    );
    if (!validItems.length) return;

    const doc = new jsPDF();

    const primaryColor = "#FF6B6B";
    const darkGray = "#333333";

    doc.setFillColor(darkGray);
    doc.rect(0, 0, 210, 30, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Hustle", 20, 18);
    doc.setTextColor(primaryColor);
    doc.text("Kit", 44, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("INVOICE", 190, 16, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(businessName || "YOUR BUSINESS NAME", 20, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Official invoice", 20, 46);

    const startY = 55;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Bill To:", 20, startY);
    doc.setFont("helvetica", "normal");
    doc.text(clientName || "Client Name", 20, startY + 6);
    doc.text(clientEmail || "client@example.com", 20, startY + 12);

    doc.setFont("helvetica", "bold");
    doc.text("Invoice Details:", 120, startY);
    doc.setFont("helvetica", "normal");
    doc.text(`Type: ${invoiceType}`, 120, startY + 6);
    doc.text(`Status: ${invoiceStatus}`, 120, startY + 12);
    doc.text(`Currency: ${currency}`, 120, startY + 18);

    const tableTop = startY + 32;

    doc.setFillColor(245, 245, 245);
    doc.rect(20, tableTop, 170, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.text("Description", 22, tableTop + 7);
    doc.text("Qty", 110, tableTop + 7);
    doc.text("Unit Price", 130, tableTop + 7);
    doc.text("Amount", 190, tableTop + 7, { align: "right" });

    let currentY = tableTop + 18;
    let total = 0;

    doc.setFont("helvetica", "normal");

    validItems.forEach((item) => {
      const qty = Number(item.qty) || 1;
      const unit = Number(item.price) || 0;
      const lineTotal = qty * unit;
      total += lineTotal;

      doc.text(item.description, 22, currentY);
      doc.text(String(qty), 112, currentY);
      doc.text(`${currency} ${unit.toFixed(2)}`, 130, currentY);
      doc.text(`${currency} ${lineTotal.toFixed(2)}`, 190, currentY, {
        align: "right",
      });

      currentY += 8;
    });

    const totalY = currentY + 8;
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 130, totalY);
    doc.text(`${currency} ${total.toFixed(2)}`, 190, totalY, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Thank you for your business.", 20, 275);

    doc.save("invoice.pdf");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Tools & Generators</h2>
          <p className="mt-1 text-xs text-gray-400">
            Quick helpers for your hustle: bios, letters, invoices, pitches, and CVs.
          </p>
        </div>
        {error && (
          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
            {error}
          </span>
        )}
      </div>

      {/* TOOL CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {[
          { key: "bio", title: "Bio Generator", desc: "Create catchy social media bios instantly." },
          { key: "letter", title: "Letter Writer", desc: "Generate professional letters for different purposes." },
          { key: "invoice", title: "Invoice Generator", desc: "Generate simple invoices for clients." },
          { key: "profit", title: "Profit Calculator", desc: "Know how much profit you make." },
          { key: "pitch", title: "Pitch Generator", desc: "Create persuasive sales pitches." },
          { key: "cv", title: "CV Generator", desc: "Build a quick professional CV." },
        ].map((tool) => (
          <button
            type="button"
            key={tool.key}
            onClick={() => setActiveTool(tool.key as any)}
            className={`text-left p-4 rounded-xl border text-sm transition cursor-pointer ${
              activeTool === tool.key
                ? "border-green-500 bg-gray-900 shadow-[0_0_0_1px_rgba(34,197,94,0.4)]"
                : "border-gray-800 bg-gray-900/80 hover:border-green-500/70"
            }`}
          >
            <h3 className="font-semibold text-sm">{tool.title}</h3>
            <p className="mt-1 text-xs text-gray-400">{tool.desc}</p>
          </button>
        ))}
      </div>

      {/* ACTIVE TOOL PANEL */}
      {activeTool === "bio" && (
        <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 space-y-3">
          <h3 className="text-sm font-semibold mb-1 text-orange-300">
            Bio Generator
          </h3>
          <input
            placeholder="What do you do?"
            value={bioInput}
            onChange={(e) => setBioInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") generateBio();
            }}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <button
            onClick={generateBio}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
          {generatedBio && (
            <div className="bg-black/80 p-3 rounded flex justify-between items-center gap-2">
              <span className="text-sm break-words">{generatedBio}</span>
              <button
                onClick={() => copyToClipboard(generatedBio)}
                className="bg-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {activeTool === "letter" && (
        <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 space-y-3">
          <h3 className="text-sm font-semibold mb-1 text-orange-300">
            Letter Writer
          </h3>
          <select
            value={letterType}
            onChange={(e) => setLetterType(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          >
            <option value="formal">Formal Letter</option>
            <option value="informal">Informal Letter</option>
            <option value="job">Job Application</option>
          </select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              placeholder="To"
              value={toPerson}
              onChange={(e) => setToPerson(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-sm"
            />
            <input
              placeholder="From"
              value={fromPerson}
              onChange={(e) => setFromPerson(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-sm"
            />
          </div>

          <textarea
            placeholder="Write your message..."
            value={letterBody}
            onChange={(e) => setLetterBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                generateLetter();
              }
            }}
            className="w-full p-2 rounded bg-gray-800 text-sm min-h-[120px]"
          />

          <button
            onClick={generateLetter}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Letter"}
          </button>

          {generatedLetter && (
            <div className="bg-black/80 p-3 rounded text-sm space-y-2">
              <pre className="whitespace-pre-line">{generatedLetter}</pre>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copyToClipboard(generatedLetter)}
                  className="bg-gray-700 px-3 py-1 rounded text-xs"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => downloadLetter(generatedLetter)}
                  className="bg-green-600 px-3 py-1 rounded text-xs"
                >
                  📄 Download
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTool === "profit" && (
        <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 space-y-3">
          <h3 className="text-sm font-semibold mb-1 text-orange-300">
            Profit Calculator
          </h3>
          <input
            placeholder="Cost price"
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Selling price"
            type="number"
            value={selling}
            onChange={(e) => setSelling(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <button
            onClick={calculateProfit}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-semibold"
          >
            Calculate
          </button>
          {profit && (
            <div className="bg-black/80 p-3 rounded text-sm">
              Profit: <span className="text-green-400">{profit}</span>
            </div>
          )}
        </div>
      )}

      {activeTool === "invoice" && (
        <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 space-y-3">
          <h3 className="text-sm font-semibold mb-1 text-orange-300">
            Invoice Generator
          </h3>

          <input
            placeholder="Your business name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />

          <select
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          >
            <option value="service">Service</option>
            <option value="product">Product</option>
          </select>
          <small className="text-xs text-gray-400">
            Select the type of invoice you are generating.
          </small>

          <input
            placeholder="Client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Client email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />

          <select
            value={invoiceStatus}
            onChange={(e) => setInvoiceStatus(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          >
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
          <small className="text-xs text-gray-400">
            Choose the current status of the invoice.
          </small>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <small className="text-xs text-gray-400">Choose the currency.</small>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-3 gap-2">
                <input
                  placeholder={`Item ${index + 1} description`}
                  value={item.description}
                  onChange={(e) => {
                    const next = [...items];
                    next[index].description = e.target.value;
                    setItems(next);
                  }}
                  className="p-2 rounded bg-gray-800 text-xs"
                />
                <input
                  placeholder="Qty"
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => {
                    const next = [...items];
                    next[index].qty = Number(e.target.value) || 1;
                    setItems(next);
                  }}
                  className="p-2 rounded bg-gray-800 text-xs"
                />
                <input
                  placeholder="Unit price"
                  type="number"
                  min="0"
                  value={item.price}
                  onChange={(e) => {
                    const next = [...items];
                    next[index].price = e.target.value;
                    setItems(next);
                  }}
                  className="p-2 rounded bg-gray-800 text-xs"
                />
              </div>
            ))}

            {items.length < 3 && (
              <button
                type="button"
                onClick={() =>
                  setItems([...items, { description: "", qty: 1, price: "" }])
                }
                className="text-xs text-green-400 mt-1"
              >
                + Add another item
              </button>
            )}
          </div>

          <button
            onClick={generatePDFInvoice}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition font-semibold w-full text-sm"
          >
            Generate Invoice
          </button>
        </div>
      )}

      {activeTool === "pitch" && (
        <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 space-y-3">
          <h3 className="text-sm font-semibold mb-1 text-orange-300">
            Pitch Generator
          </h3>

          <select
            value={pitchType}
            onChange={(e) => setPitchType(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          >
            <option value="sales">Sales Pitch</option>
            <option value="project">Project Pitch</option>
            <option value="idea">Idea Pitch</option>
          </select>
          <small className="text-xs text-gray-400">
            Select the type of pitch you want to generate.
          </small>

          <select
            value={audienceType}
            onChange={(e) => setAudienceType(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          >
            <option value="investors">Investors</option>
            <option value="clients">Clients</option>
            <option value="partners">Partners</option>
          </select>
          <small className="text-xs text-gray-400">
            Select the audience you&apos;re targeting.
          </small>

          <input
            placeholder="Enter details..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") generatePitch();
            }}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <small className="text-xs text-gray-400">
            Add key details like your offer, value, and target.
          </small>

          <button
            onClick={generatePitch}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Pitch"}
          </button>

          {output && (
            <div className="bg-black/80 p-3 rounded whitespace-pre-line flex justify-between items-start gap-2">
              <span className="text-sm break-words">{output}</span>
              <button
                onClick={() => copyToClipboard(output)}
                className="bg-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {activeTool === "cv" && (
        <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 space-y-3">
          <h3 className="text-sm font-semibold mb-1 text-orange-300">
            CV Generator
          </h3>

          <input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />

          <input
            placeholder="Contact (e.g. 0803..., email, city)"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-xs"
          />
          <small className="text-xs text-gray-400">
            Add phone, email, and city in one line.
          </small>

          <input
            placeholder="Role (e.g. Frontend Developer)"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />

          <textarea
            placeholder="Short summary about you"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />

          <textarea
            placeholder="Experience (one role per line)"
            value={experienceText}
            onChange={(e) => setExperienceText(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />

          <input
            placeholder="Company 1"
            value={expCompany1}
            onChange={(e) => setExpCompany1(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Role 1"
            value={expRole1}
            onChange={(e) => setExpRole1(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Year or period"
            value={expYear1}
            onChange={(e) => setExpYear1(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <textarea
            placeholder="Key duties for this role (one per line)"
            value={expDuties1}
            onChange={(e) => setExpDuties1(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-xs"
          />

          <input
            placeholder="Company 2 (optional)"
            value={expCompany2}
            onChange={(e) => setExpCompany2(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Role 2"
            value={expRole2}
            onChange={(e) => setExpRole2(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Year or period"
            value={expYear2}
            onChange={(e) => setExpYear2(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <textarea
            placeholder="Key duties for this role (optional, one per line)"
            value={expDuties2}
            onChange={(e) => setExpDuties2(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-xs"
          />

          <textarea
            placeholder="Education (school, degree, year)"
            value={educationText}
            onChange={(e) => setEducationText(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Tertiary institution"
            value={eduSchool}
            onChange={(e) => setEduSchool(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Degree"
            value={eduDegree}
            onChange={(e) => setEduDegree(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Graduation year"
            value={eduYear}
            onChange={(e) => setEduYear(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Secondary school (optional)"
            value={eduSchool2}
            onChange={(e) => setEduSchool2(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Qualification (e.g. WAEC)"
            value={eduQual2}
            onChange={(e) => setEduQual2(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <input
            placeholder="Year"
            value={eduYear2}
            onChange={(e) => setEduYear2(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />

          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          >
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
          </select>
          <small className="text-xs text-gray-400">
            Select your experience level.
          </small>

          <input
            placeholder="Enter skills"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") generateCV();
            }}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />
          <small className="text-xs text-gray-400">
            Enter your relevant skills (e.g., tools, languages).
          </small>

          <button
            onClick={generateCV}
            className="bg-green-600 px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate CV"}
          </button>

          {generatedCV && (
            <>
              <div className="bg-black/80 p-3 rounded whitespace-pre-line flex justify-between items-start gap-2">
                <span className="text-sm break-words">{generatedCV}</span>
                <button
                  onClick={() => copyToClipboard(generatedCV)}
                  className="bg-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap"
                >
                  Copy
                </button>
              </div>

              <button
                onClick={generateCVCvPDF}
                className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm mt-2"
              >
                Download CV as PDF
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
  type ProfileProps = {
  user: { username: string; hustleId: string };
};

function Profile({ user }: ProfileProps) {
  const [profileName, setProfileName] = useState(user.username);
  const [profileId, setProfileId] = useState(user.hustleId);
  const [profileEmail, setProfileEmail] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileFocus, setProfileFocus] = useState("investing");
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function saveProfile() {
    try {
      setProfileLoading(true);
      toast.success("Profile saved!");
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save profile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function deleteProfile() {
    if (!confirm("Are you sure you want to delete your profile?")) return;

    try {
      setProfileId("");
      setProfileName("");
      setProfileEmail("");
      setProfileLocation("");
      setProfileBio("");
      setProfileFocus("investing");
      setAvatarUrl(null);

      toast.success("Profile deleted");
      setSettingsOpen(false);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete profile");
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Your Profile</h2>
        <p className="mt-1 text-xs text-gray-400">
          This is how other Hustlers see you around HustleKit.
        </p>
      </div>

      {/* Header: avatar + name + ID + menu */}
      <div className="flex items-center justify-between mb-2">
        {/* Left: avatar + name + ID */}
        <div className="flex items-center gap-4">
          {/* Avatar wrapper */}
          <div className="relative w-16 h-16">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-xl font-bold overflow-hidden border border-orange-500/40"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {profileName ? profileName[0].toUpperCase() : "H"}
                </span>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setAvatarUrl(url);
              }}
            />
          </div>

          {/* Name + ID */}
          <div>
            <div className="text-lg font-semibold">
              {profileName || user.username}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
              <span className="font-mono text-orange-300">
                {profileId || user.hustleId}
              </span>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(profileId || user.hustleId)
                }
                className="px-2 py-1 border border-gray-600 rounded text-[11px] hover:bg-gray-800"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Right: 3-dot menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800"
            aria-label="Profile menu"
          >
            <div className="flex flex-col items-center justify-center gap-[2px]">
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-800 rounded-lg shadow-lg text-sm z-20">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setSettingsOpen(false);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-800"
              >
                Edit profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(true);
                  setIsEditing(false);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-800"
              >
                Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Small chip for focus */}
      <div className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/40 px-3 py-1 text-[11px] text-orange-300">
        <span>Main focus:</span>
        <span className="capitalize">{profileFocus}</span>
      </div>

      {/* Edit form */}
      {isEditing && !settingsOpen && (
        <div className="bg-gray-900/80 p-4 rounded-xl space-y-3 border border-gray-800">
          <input
            placeholder="Full name"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />

          <input
            placeholder="Email"
            type="email"
            value={profileEmail}
            onChange={(e) => setProfileEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />

          <input
            placeholder="Location (e.g. Abuja, Nigeria)"
            value={profileLocation}
            onChange={(e) => setProfileLocation(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />

          <textarea
            placeholder="Short bio (what do you do?)"
            value={profileBio}
            onChange={(e) => setProfileBio(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          />

          <select
            value={profileFocus}
            onChange={(e) => setProfileFocus(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-sm"
          >
            <option value="investing">Main focus: Investing</option>
            <option value="freelancing">Main focus: Freelancing</option>
            <option value="jobs">Main focus: Job hunting</option>
            <option value="products">Main focus: Selling products</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={saveProfile}
              disabled={profileLoading}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition font-semibold text-sm disabled:opacity-50"
            >
              {profileLoading ? "Saving..." : "Save Profile"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {settingsOpen && !isEditing && (
        <div className="bg-gray-900/80 p-4 rounded-xl space-y-4 border border-gray-800">
          <h3 className="text-lg font-semibold">Settings</h3>

          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>Email notifications</span>
              <span className="px-2 py-1 rounded bg-gray-800 text-xs">
                Coming soon
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Download my data</span>
              <button
                type="button"
                className="px-2 py-1 border border-gray-700 rounded text-xs hover:bg-gray-800"
                onClick={() => toast("Export coming soon")}
              >
                Export
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span>Delete account</span>
              <button
                type="button"
                className="px-2 py-1 border border-red-600 text-red-400 rounded text-xs hover:bg-red-900/40"
                onClick={deleteProfile}
              >
                Delete
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-200"
          >
            Close settings
          </button>
        </div>
      )}
    </div>
  );
}
  type ChatProps = {
  myHustleId?: string;
};

function Chat({ myHustleId }: ChatProps) {
  const [targetIdInput, setTargetIdInput] = useState("");
  const [targetId, setTargetId] = useState("");
  const [myId, setMyId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);

  // load myId from logged-in user HustleID
 useEffect(() => {
  if (myHustleId) setMyId(myHustleId);
}, [myHustleId]);
  // listen to messages only when chat is open
  useEffect(() => {
    if (!myId || !targetId) return;

    const chatId = [myId, targetId].sort().join("_");
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(data);
    });

    return () => unsub();
  }, [myId, targetId]);

  async function sendMessage() {
    if (!myId || !targetId || !newMessage.trim()) return;

    const chatId = [myId, targetId].sort().join("_");
    const messagesRef = collection(db, "chats", chatId, "messages");
    const text = newMessage.trim();

    // add message
    await addDoc(messagesRef, {
      from: myId,
      to: targetId,
      text,
      createdAt: new Date().toISOString(),
    });

    // upsert chat summary
    const chatDocRef = doc(db, "chats", chatId);
    await setDoc(
      chatDocRef,
      {
        users: [myId, targetId],
        lastMessage: text,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    setNewMessage("");
  }

  // recent chats list
  useEffect(() => {
    if (!myId) return;

    const chatsRef = collection(db, "chats");
    const qChats = query(
      chatsRef,
      where("users", "array-contains", myId),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(qChats, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentChats(data);
    });

    return () => unsub();
  }, [myId]);

  function startEditingMessage(m: any) {
    setEditingMessageId(m.id);
    setEditingText(m.text);
  }

  async function deleteMessage(m: any) {
    if (!myId || !targetId) return;
    if (m.from !== myId) return;
    if (!confirm("Delete this message?")) return;

    const chatId = [myId, targetId].sort().join("_");
    const msgRef = doc(db, "chats", chatId, "messages", m.id);

    await deleteDoc(msgRef);
  }

  async function saveEditedMessage() {
    if (!myId || !targetId || !editingMessageId || !editingText.trim()) return;

    const chatId = [myId, targetId].sort().join("_");
    const msgRef = doc(db, "chats", chatId, "messages", editingMessageId);

    await updateDoc(msgRef, {
      text: editingText.trim(),
      editedAt: new Date().toISOString(),
    });

    setEditingMessageId(null);
    setEditingText("");
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Chat</h2>
        <p className="mt-1 text-xs text-gray-400">
          Connect with any HustleID and keep conversations in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: recent chats */}
        <div className="border border-gray-800 rounded-lg p-3 bg-black/40">
          <h3 className="text-sm font-semibold mb-2 text-orange-300">
            Recent chats
          </h3>

          {recentChats.length === 0 && (
            <p className="text-xs text-gray-500">
              No chats yet. Start one by HustleID.
            </p>
          )}

          <ul className="space-y-1">
            {recentChats.map((chat) => {
              const otherId =
                chat.users?.find((u: string) => u !== myId) ?? "Unknown";

              const isActive = targetId === otherId;

              return (
                <li
                  key={chat.id}
                  onClick={() => {
                    setTargetId(otherId);
                    setTargetIdInput(otherId);
                  }}
                  className={`p-2 rounded cursor-pointer text-xs transition border ${
                    isActive
                      ? "border-orange-500/70 bg-gray-900"
                      : "border-transparent hover:border-gray-700 hover:bg-gray-900/60"
                  }`}
                >
                  <div className="text-gray-300 font-mono">{otherId}</div>
                  <div className="text-gray-500 truncate">
                    {chat.lastMessage || "No messages yet"}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right: active chat */}
        <div className="md:col-span-2">
          <div className="mb-3 flex gap-2">
            <input
              placeholder="Their HustleID (e.g. HK-XXXXXX)"
              value={targetIdInput}
              onChange={(e) => setTargetIdInput(e.target.value.toUpperCase())}
              className="flex-1 p-2 rounded bg-gray-900 border border-gray-800 text-sm"
            />
            <button
              type="button"
              onClick={() => setTargetId(targetIdInput.trim())}
              className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-sm font-semibold"
            >
              Open
            </button>
          </div>

          {targetId ? (
            <>
              <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
                <span>
                  Chatting with{" "}
                  <span className="font-mono text-orange-300">{targetId}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTargetId("");
                    setTargetIdInput("");
                    setMessages([]);
                    setEditingMessageId(null);
                    setEditingText("");
                  }}
                  className="text-[11px] px-2 py-1 rounded border border-gray-700 hover:bg-gray-800"
                >
                  Close
                </button>
              </div>

              <div className="h-80 border border-gray-800 rounded-lg p-3 flex flex-col gap-2 overflow-y-auto bg-black/30">
                {messages.map((m) => {
                  const isMine = m.from === myId;
                  const isMenuOpen = menuMessageId === m.id;

                  return (
                    <div key={m.id} className={isMine ? "ml-auto" : "mr-auto"}>
                      <div
                        onClick={() =>
                          setMenuMessageId(isMenuOpen ? null : m.id)
                        }
                        className={
                          (isMine
                            ? "bg-gradient-to-r from-green-600 to-orange-500 text-white"
                            : "bg-gray-800 text-white") +
                          " max-w-[70%] px-3 py-2 rounded-xl text-sm cursor-pointer"
                        }
                      >
                        {m.text}
                      </div>

                      {isMenuOpen && (
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(m.text || "");
                              setMenuMessageId(null);
                            }}
                            className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                          >
                            Copy
                          </button>

                          {isMine && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  startEditingMessage(m);
                                  setMenuMessageId(null);
                                }}
                                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteMessage(m);
                                  setMenuMessageId(null);
                                }}
                                className="px-2 py-1 rounded bg-red-700 hover:bg-red-800"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {messages.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No messages yet. Say hi 👋
                  </p>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  placeholder={
                    editingMessageId ? "Edit message..." : "Type a message..."
                  }
                  value={editingMessageId ? editingText : newMessage}
                  onChange={(e) =>
                    editingMessageId
                      ? setEditingText(e.target.value)
                      : setNewMessage(e.target.value)
                  }
                  className="flex-1 p-2 rounded bg-gray-900 border border-gray-800 text-sm"
                />
                {editingMessageId ? (
                  <>
                    <button
                      type="button"
                      onClick={saveEditedMessage}
                      className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-sm font-semibold"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMessageId(null);
                        setEditingText("");
                      }}
                      className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-800 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={sendMessage}
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 font-semibold text-sm"
                  >
                    Send
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500 mt-4">
              Enter a HustleID above or click a recent chat on the left.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
async function startToolsSub() {
  const res = await fetch("/api/flutterwave/subscribe-tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, email: user.email }),
  });

  const data = await res.json();
  if (data.link) {
    window.location.href = data.link; // go to Flutterwave checkout
  } else {
    alert("Could not start payment, please try again.");
  }
}

