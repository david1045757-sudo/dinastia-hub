import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, MTA_IDENTITY_REGEX } from "@/lib/dinastia";

export function NewTicketForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [identity, setIdentity] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const identityValid = MTA_IDENTITY_REGEX.test(identity.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!identityValid) {
      toast.error("Formato inválido. Usa: Nombre_Apellido ID (ej: Johan_David 1)");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        category,
        mta_identity: identity.trim(),
      })
      .select("id")
      .single();

    if (error || !data) {
      setBusy(false);
      toast.error(error?.message ?? "No se pudo crear el ticket.");
      return;
    }

    const { error: msgError } = await supabase.from("ticket_messages").insert({
      ticket_id: data.id,
      user_id: user.id,
      body: body.trim(),
    });
    setBusy(false);
    if (msgError) {
      toast.error(msgError.message);
      return;
    }
    toast.success("Ticket creado correctamente.");
    void navigate({ to: "/mis-tickets/$id", params: { id: data.id } });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-xl font-semibold">Abrir ticket</h2>

      <div className="space-y-2">
        <Label htmlFor="identity">Nombre e ID de MTA</Label>
        <Input
          id="identity"
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="Johan_David 1"
          required
          aria-invalid={identity.length > 0 && !identityValid}
        />
        <p
          className={
            identity.length > 0 && !identityValid
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          Formato obligatorio: Nombre_Apellido ID. No podrás modificarlo después.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subject">Asunto</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Problema con mi cuenta"
            maxLength={120}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Describe tu problema</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={7}
          placeholder="Cuéntanos qué ha ocurrido…"
          required
        />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={busy}>
        {busy ? "Enviando…" : "Abrir ticket"}
      </Button>
    </form>
  );
}
