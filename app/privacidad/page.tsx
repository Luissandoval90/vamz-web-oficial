import type { Metadata } from "next";
import { PublicFrame } from "@/components/public-frame";
export const metadata: Metadata = { title: "Privacidad" };
export default function PrivacyPage() {
  return (
    <PublicFrame>
      <main id="contenido" className="page-shell privacy-page">
        <p className="section-kicker">Tu cuenta y tus datos</p>
        <h1>Privacidad, sin letra pequeña.</h1>
        <p>
          VAMZ almacena la información necesaria para tus cuentas, las reseñas y
          el funcionamiento de la biblioteca en su propia VPS.
        </p>
        <h2>Tu cuenta</h2>
        <p>
          Al registrarte guardamos tu correo, tu nombre de usuario y un hash
          protegido de tu contraseña. El correo no aparece en las reseñas; el
          nombre de usuario sí es público cuando una reseña se aprueba.
        </p>
        <h2>Reseñas</h2>
        <p>
          Puedes actualizar o retirar tu propia reseña desde la página del
          recurso. Una reseña nueva o editada queda pendiente de revisión por el
          administrador antes de publicarse.
        </p>
        <h2>Visitas y descargas</h2>
        <p>
          Utilizamos una cookie propia con un identificador aleatorio de
          navegador. Su duración máxima es de 180 días. Para evitar duplicados,
          guardamos un resumen criptográfico diario del identificador asociado
          al recurso; esos registros temporales caducan a los dos días y se
          limpian al registrar nueva actividad y se conservan los totales. No
          representan un recuento exacto de personas ni incorporan actividad
          anterior a la activación de los contadores.
        </p>
        <h2>Seguridad y cookies</h2>
        <p>
          La cookie de sesión mantiene el acceso a tu cuenta durante un máximo
          de siete días. Los intentos de autenticación y otras acciones tienen
          límites para reducir el abuso; sus identificadores se guardan como
          resúmenes criptográficos temporales. No añadimos cookies publicitarias
          ni herramientas externas de analítica.
        </p>
        <h2>Enlaces a otras plataformas</h2>
        <p>
          Las redes sociales oficiales son enlaces externos. Al abrirlos se
          aplican las condiciones de privacidad de cada plataforma.
        </p>
      </main>
    </PublicFrame>
  );
}
