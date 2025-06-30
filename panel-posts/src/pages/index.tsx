import { useState } from "react";
//import { encode } from "@squoosh/lib";
import imageCompression from 'browser-image-compression';
import toast from "react-hot-toast";

export default function Home() {
  const [titulo, setTitulo] = useState("");
  const [extracto, setExtracto] = useState("");
  const [contenido, setContenido] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject("No se pudo leer la imagen.");
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imagen) {
      alert("Seleccioná una imagen antes de publicar.");
      return;
    }

    try {
      const options = {
        maxSizeMB: 1, 
        maxWidthOrHeight: 1024, 
        useWebWorker: true,
      };

      const imagenComprimida = await imageCompression(imagen, options);
      const imagenBase64 = await readFileAsBase64(imagenComprimida);

        const postData = {
          titulo,
          extracto,
          contenido,
          imagenBase64,
        };

        const loadingToast = toast.loading("Publicando post...");

        const response = await fetch('/api/publicar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        toast.dismiss(loadingToast);
        const data = await response.json();

        if (response.ok) {
        toast.success("¡Post publicado con éxito!");

        // Reset del formulario
        setTitulo("");
        setExtracto("");
        setContenido("");
        setImagen(null);
        setImagenPreview(null);
      } else {
        console.error("Error al publicar:", data);
        toast.error(`Error al publicar: ${data.message || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error al comprimir imagen:", error);
      alert("Hubo un problema al comprimir la imagen.");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagen(file);
      setImagenPreview(URL.createObjectURL(file));
    }
  };

  return (
    <main className="min-h-screen p-10 bg-gray-100">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Crear nuevo post</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Título"
            className="w-full border border-gray-300 bg-white text-gray-800 px-4 py-2 rounded shadow-sm"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <textarea
            placeholder="Extracto (opcional)"
            className="w-full border border-gray-300 bg-white text-gray-800 px-4 py-2 rounded shadow-sm h-32"
            value={extracto}
            onChange={(e) => setExtracto(e.target.value)}
          />
          <textarea
            placeholder="Contenido"
            className="w-full border border-gray-300 bg-white text-gray-800 px-4 py-2 rounded h-40 shadow-sm"
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
          />
          <input
            className="w-full border border-gray-300 bg-white text-gray-800 px-4 py-2 rounded shadow-sm"
            type="file"
            accept="image/*"
            onChange={handleImageChange} />
          {imagenPreview && (
            <img src={imagenPreview} alt="Preview" className="max-w-sm mt-4" />
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Publicar
          </button>
        </form>
      </div>
    </main>
  );
}
