import { AddClient } from "@/components/add/add-client";
import { redirect } from "next/navigation";

export default function AddPage() {
    // Redirect to ask page as per the new design
    redirect('/ask');
}
