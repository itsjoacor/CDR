import { supabase } from '@/app/utils/supabase';



export async function eliminarImagenPorURL(url: string) {
    try {
        if (!url.includes("/object/public/")) return;

        const path = url.split("/object/public/")[1];
        const [bucket, ...rest] = path.split("/");
        const filePath = decodeURIComponent(rest.join("/"));

        console.log("Trying to delete:", bucket, filePath);

        const { data, error } = await supabase.storage.from(bucket).remove([filePath]);
        console.log("Delete response:", { data, error });

        if (error) {
            console.error(`Error deleting image from ${bucket}:`, error.message);
        }
    } catch (err) {
        console.error("Error parsing image URL:", err);
    }
}



export async function eliminarMultiplesImagenesPorURLs(urls: string[]) {
    const pathsByBucket = new Map<string, string[]>();

    for (const url of urls) {
        if (!url.includes("/object/public/")) continue;

        const path = url.split("/object/public/")[1];
        const [bucket, ...rest] = path.split("/");
        const filePath = decodeURIComponent(rest.join("/"));


        if (!pathsByBucket.has(bucket)) {
            pathsByBucket.set(bucket, []);
        }
        pathsByBucket.get(bucket)!.push(filePath);
    }

    for (const [bucket, paths] of pathsByBucket.entries()) {
        const { error } = await supabase.storage.from(bucket).remove(paths);
        if (error) {
            console.error(`Error deleting images from bucket "${bucket}":`, error.message);
        }
    }
}
