// pages/api/publicar.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { titulo, extracto, contenido, imagenBase64 } = req.body;

  try {
    // Preparar autenticación básica
    const auth = Buffer.from(`${process.env.WP_USER}:k24W eaXX aRIK wzdC DSHM D6Qz`).toString('base64');

    console.log("🔍 Recibido:", { titulo, extracto, tieneImagen: !!imagenBase64 });
    // Subir imagen destacada
    const uploadRes = await fetch(`${process.env.WP_URL}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename=imagen.jpg',
      },
      body: Buffer.from(imagenBase64.split(',')[1], 'base64'),
    });

    const mediaData = await uploadRes.json();
    console.log("📸 Respuesta /media:", uploadRes.status, mediaData);

    //const imagenSubida = await uploadRes.json();

    if (!uploadRes.ok) {
      return res.status(500).json({ message: "Error al subir imagen", error: mediaData });
    }

    // Crear el post
    const postRes = await fetch(`${process.env.WP_URL}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: titulo,
        excerpt: extracto,
        content: contenido,
        status: 'publish', // o 'draft'
        featured_media: mediaData.id,
      }),
    });

    const postData = await postRes.json();
    // 🔗 Forzar adjuntar la imagen al post
await fetch(`${process.env.WP_URL}/wp-json/wp/v2/media/${mediaData.id}`, {
  method: 'POST',
  headers: {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    post: postData.id,  // 👈 Ancla la imagen al post
  }),
});

    console.log("📝 Respuesta /posts:", postRes.status, postData);

    if (!postRes.ok) {
      return res.status(500).json({ message: 'Error al crear post', error: postData });
    }

    return res.status(200).json({ message: 'Post creado correctamente', postData });
  } catch (error) {
    console.error("🔥 ERROR GENERAL:", error);
    return res.status(500).json({ message: "Error general", error: String(error) });
  }
}
