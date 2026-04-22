"use client";
import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { canManageProperties, useAuth } from "../../../../lib/auth-context";
import { api } from "../../../../lib/api";

const types = ["APARTMENT", "VILLA", "HOUSE", "STUDIO", "PLOT", "COMMERCIAL"];
const statuses = ["AVAILABLE", "PENDING", "SOLD"];
const MAX_IMAGE_SIZE_MB = 5;
const priceUnits = [
  { label: "INR", value: "INR", multiplier: 1 },
  { label: "Thousand", value: "THOUSAND", multiplier: 1_000 },
  { label: "Lakh", value: "LAKH", multiplier: 100_000 },
  { label: "Crore", value: "CRORE", multiplier: 10_000_000 },
  { label: "Million", value: "MILLION", multiplier: 1_000_000 },
] as const;

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [priceUnit, setPriceUnit] = useState<(typeof priceUnits)[number]["value"]>("INR");
  const { role, isReady } = useAuth();

  const canSubmit = useMemo(() => !loading && !uploadingImages, [loading, uploadingImages]);

  if (!isReady) {
    return <div className="container py-12"><p className="text-sm text-slate-600">Checking access...</p></div>;
  }
  if (!canManageProperties(role)) {
    return <div className="container py-12"><p className="text-sm text-slate-600">Only agents or admins can add properties.</p></div>;
  }

  const uploadSelectedFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;

    setError("");
    setUploadingImages(true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(fileList)) {
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          throw new Error(`${file.name} is larger than ${MAX_IMAGE_SIZE_MB} MB.`);
        }

        const payload = new FormData();
        payload.append("image", file);
        const { data } = await api.post("/properties/upload-image", payload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        uploadedUrls.push(data.url);
      }

      setImages((current) => [...current, ...uploadedUrls]);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to upload image.");
    } finally {
      setUploadingImages(false);
      event.target.value = "";
    }
  };

  const addImageUrl = () => {
    const trimmed = imageUrlDraft.trim();
    if (!trimmed) return;
    setImages((current) => Array.from(new Set([...current, trimmed])));
    setImageUrlDraft("");
  };

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setLoading(true);
    try {
      const rawPrice = Number(formData.get("price"));
      if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
        throw new Error("Price must be greater than 0.");
      }

      const selectedPriceUnit = priceUnits.find((unit) => unit.value === priceUnit) || priceUnits[0];
      const normalizedPrice = Math.round(rawPrice * selectedPriceUnit.multiplier);

      const payload = {
        title: formData.get("title"),
        description: formData.get("description"),
        price: normalizedPrice,
        location: formData.get("location"),
        type: formData.get("type"),
        bedrooms: Number(formData.get("bedrooms")),
        bathrooms: Number(formData.get("bathrooms")),
        areaSqFt: Number(formData.get("areaSqFt")),
        status: formData.get("status"),
        amenities,
        images,
      } as any;

      const { data } = await api.post("/properties", payload);
      router.push(`/properties/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10 space-y-6">
      <h1 className="text-3xl font-semibold">Add New Property</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form
        className="space-y-4 bg-white p-6 rounded-2xl border"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(new FormData(e.currentTarget));
        }}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <input name="title" required placeholder="Title" className="border rounded-lg px-3 py-2" />
          <input name="location" required placeholder="Location" className="border rounded-lg px-3 py-2" />
          <div className="grid grid-cols-[1fr_160px] gap-2 md:col-span-2">
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="Price"
              className="border rounded-lg px-3 py-2"
            />
            <select
              name="priceUnit"
              value={priceUnit}
              onChange={(event) => setPriceUnit(event.target.value as (typeof priceUnits)[number]["value"])}
              className="border rounded-lg px-3 py-2"
            >
              {priceUnits.map((unit) => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>
          <input name="areaSqFt" type="number" placeholder="Area (sq ft)" className="border rounded-lg px-3 py-2" />
          <select name="type" className="border rounded-lg px-3 py-2" required>
            <option value="">Type</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select name="status" className="border rounded-lg px-3 py-2" defaultValue="AVAILABLE">
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input name="bedrooms" type="number" min="0" placeholder="Bedrooms" className="border rounded-lg px-3 py-2" />
          <input name="bathrooms" type="number" min="0" placeholder="Bathrooms" className="border rounded-lg px-3 py-2" />
        </div>
        <p className="text-xs text-slate-500">
          The amount you enter will be converted and stored as a full INR value. Example: <span className="font-medium">2.5 + Crore</span> becomes <span className="font-medium">₹2,50,00,000</span>.
        </p>
        <textarea name="description" required rows={4} placeholder="Description" className="w-full border rounded-lg px-3 py-2" />

        <div className="space-y-2">
          <p className="text-sm font-medium">Amenities (press Enter to add)</p>
          <input
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const val = (e.currentTarget as HTMLInputElement).value.trim();
                if (val) setAmenities((a) => Array.from(new Set([...a, val])));
                (e.currentTarget as HTMLInputElement).value = "";
              }
            }}
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="Type an amenity and press Enter"
          />
          <div className="flex flex-wrap gap-2">
            {amenities.map((a) => (
              <span key={a} className="px-3 py-1 bg-brand-soft rounded-full text-sm flex items-center gap-2">
                {a}
                <button type="button" onClick={() => setAmenities((am) => am.filter((x) => x !== a))} className="text-slate-500">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Property images</p>
            <span className="text-xs text-slate-500">JPG, PNG, WEBP, AVIF up to {MAX_IMAGE_SIZE_MB} MB each</span>
          </div>
          <div className="rounded-2xl border border-dashed p-4 space-y-3 bg-slate-50">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={uploadSelectedFiles} />
                {uploadingImages ? "Uploading..." : "Upload image"}
              </label>
              <span className="text-sm text-slate-500">
                {images.length > 0 ? `${images.length} image${images.length === 1 ? "" : "s"} added` : "No images added yet"}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                className="border rounded-lg px-3 py-2 w-full bg-white"
                placeholder="Or paste an image URL"
                value={imageUrlDraft}
                onChange={(e) => setImageUrlDraft(e.target.value)}
              />
              <button type="button" className="px-3 py-2 border rounded-lg bg-white" onClick={addImageUrl}>
                Add URL
              </button>
            </div>

            {images.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {images.map((url) => (
                  <div key={url} className="rounded-2xl border bg-white p-3">
                    <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                      <img src={url} alt="Property upload preview" className="h-full w-full object-cover" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="truncate text-xs text-slate-500">{url}</p>
                      <button
                        type="button"
                        className="text-sm text-slate-600"
                        onClick={() => setImages((current) => current.filter((item) => item !== url))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="bg-brand text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
        >
          {loading ? "Saving..." : uploadingImages ? "Waiting for uploads..." : "Create property"}
        </button>
      </form>
    </div>
  );
}
