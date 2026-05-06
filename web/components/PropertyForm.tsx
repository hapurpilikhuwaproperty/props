"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { resolveMediaUrl } from "../lib/media";
import { Property } from "../types";

const types = ["APARTMENT", "VILLA", "HOUSE", "STUDIO", "PLOT", "COMMERCIAL"];
const statuses = ["AVAILABLE", "PENDING", "SOLD"];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 75;
const priceUnits = [
  { label: "INR", value: "INR", multiplier: 1 },
  { label: "Thousand", value: "THOUSAND", multiplier: 1_000 },
  { label: "Lakh", value: "LAKH", multiplier: 100_000 },
  { label: "Crore", value: "CRORE", multiplier: 10_000_000 },
  { label: "Million", value: "MILLION", multiplier: 1_000_000 },
] as const;

type PropertyFormProps = {
  mode: "create" | "edit";
  initialProperty?: Property;
};

const getAmenityNames = (property?: Property) =>
  property?.amenities?.map((item) => item.amenity.name).filter(Boolean) || [];

const getImageUrls = (property?: Property) =>
  property?.images?.map((image) => image.url).filter(Boolean) || [];

const optionalNumber = (value: FormDataEntryValue | null, emptyValue: undefined | null = undefined) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return emptyValue;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) throw new Error("Enter a valid number.");
  return parsed;
};

export default function PropertyForm({ mode, initialProperty }: PropertyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState<string[]>(() => getImageUrls(initialProperty));
  const [amenities, setAmenities] = useState<string[]>(() => getAmenityNames(initialProperty));
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [videoUrl, setVideoUrl] = useState(initialProperty?.videoUrl || "");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [priceUnit, setPriceUnit] = useState<(typeof priceUnits)[number]["value"]>("INR");

  const canSubmit = useMemo(() => !loading && !uploadingImages && !uploadingVideo, [loading, uploadingImages, uploadingVideo]);
  const isEditing = mode === "edit";

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

  const uploadSelectedVideo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setUploadingVideo(true);

    try {
      if (!["video/mp4", "video/webm"].includes(file.type)) {
        throw new Error("Only MP4 and WEBM videos are allowed.");
      }
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        throw new Error(`${file.name} is larger than ${MAX_VIDEO_SIZE_MB} MB.`);
      }

      const payload = new FormData();
      payload.append("video", file);
      const { data } = await api.post("/properties/upload-video", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setVideoUrl(data.url);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to upload video.");
    } finally {
      setUploadingVideo(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const rawPrice = Number(formData.get("price"));
      if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
        throw new Error("Price must be greater than 0.");
      }

      const selectedPriceUnit = priceUnits.find((unit) => unit.value === priceUnit) || priceUnits[0];
      const normalizedPrice = Math.round(rawPrice * selectedPriceUnit.multiplier);
      const areaSqFt = optionalNumber(formData.get("areaSqFt"), isEditing ? null : undefined);

      const payload = {
        title: formData.get("title"),
        description: formData.get("description"),
        price: normalizedPrice,
        location: formData.get("location"),
        type: formData.get("type"),
        bedrooms: Number(formData.get("bedrooms")),
        bathrooms: Number(formData.get("bathrooms")),
        areaSqFt,
        status: formData.get("status"),
        videoUrl: videoUrl.trim() || null,
        amenities,
        images,
      } as any;

      const response = isEditing && initialProperty
        ? await api.put(`/properties/${initialProperty.id}`, payload)
        : await api.post("/properties", payload);

      if (isEditing) {
        setSuccess("Property updated. You can continue editing.");
        router.refresh();
        return;
      }

      router.push(`/properties/${response.data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Failed to ${isEditing ? "update" : "create"} property`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 bg-white p-6 rounded-2xl border" onSubmit={handleSubmit}>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        <input name="title" required defaultValue={initialProperty?.title || ""} placeholder="Title" className="border rounded-lg px-3 py-2" />
        <input name="location" required defaultValue={initialProperty?.location || ""} placeholder="Location" className="border rounded-lg px-3 py-2" />
        <div className="grid grid-cols-[1fr_160px] gap-2 md:col-span-2">
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={initialProperty ? Number(initialProperty.price) : ""}
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
        <input name="areaSqFt" type="number" defaultValue={initialProperty?.areaSqFt ? Number(initialProperty.areaSqFt) : ""} placeholder="Area (sq ft)" className="border rounded-lg px-3 py-2" />
        <select name="type" className="border rounded-lg px-3 py-2" required defaultValue={initialProperty?.type || ""}>
          <option value="">Type</option>
          {types.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select name="status" className="border rounded-lg px-3 py-2" defaultValue={initialProperty?.status || "AVAILABLE"}>
          {statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <input name="bedrooms" type="number" min="0" defaultValue={initialProperty?.bedrooms ?? ""} placeholder="Bedrooms" className="border rounded-lg px-3 py-2" />
        <input name="bathrooms" type="number" min="0" defaultValue={initialProperty?.bathrooms ?? ""} placeholder="Bathrooms" className="border rounded-lg px-3 py-2" />
      </div>

      <p className="text-xs text-slate-500">
        The amount you enter will be converted and stored as a full INR value. Example: <span className="font-medium">2.5 + Crore</span> becomes <span className="font-medium">₹2,50,00,000</span>.
      </p>

      <textarea name="description" required rows={4} defaultValue={initialProperty?.description || ""} placeholder="Description" className="w-full border rounded-lg px-3 py-2" />

      <div className="space-y-2">
        <p className="text-sm font-medium">Amenities (press Enter to add)</p>
        <input
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              const value = event.currentTarget.value.trim();
              if (value) setAmenities((current) => Array.from(new Set([...current, value])));
              event.currentTarget.value = "";
            }
          }}
          className="border rounded-lg px-3 py-2 w-full"
          placeholder="Type an amenity and press Enter"
        />
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <span key={amenity} className="px-3 py-1 bg-brand-soft rounded-full text-sm flex items-center gap-2">
              {amenity}
              <button type="button" onClick={() => setAmenities((current) => current.filter((item) => item !== amenity))} className="text-slate-500">×</button>
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
              onChange={(event) => setImageUrlDraft(event.target.value)}
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
                    <img src={resolveMediaUrl(url)} alt="Property upload preview" className="h-full w-full object-cover" />
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

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Property video</p>
          <span className="text-xs text-slate-500">MP4 or WEBM up to {MAX_VIDEO_SIZE_MB} MB</span>
        </div>
        <div className="rounded-2xl border border-dashed p-4 space-y-3 bg-slate-50">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
              <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={uploadSelectedVideo} />
              {uploadingVideo ? "Uploading..." : "Upload video"}
            </label>
            <span className="text-sm text-slate-500">{videoUrl ? "Video added" : "No video added yet"}</span>
          </div>

          <input
            className="border rounded-lg px-3 py-2 w-full bg-white"
            placeholder="Or paste a video URL"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
          />

          {videoUrl && (
            <div className="rounded-2xl border bg-white p-3">
              <video src={resolveMediaUrl(videoUrl)} controls preload="metadata" className="aspect-video w-full rounded-xl bg-black" />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="truncate text-xs text-slate-500">{videoUrl}</p>
                <button type="button" className="text-sm text-slate-600" onClick={() => setVideoUrl("")}>
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="bg-brand text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
      >
        {loading ? "Saving..." : uploadingImages || uploadingVideo ? "Waiting for uploads..." : isEditing ? "Update property" : "Create property"}
      </button>
    </form>
  );
}
