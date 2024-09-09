import { useState, useEffect } from "react";
import xml2js from "xml2js";
import posts from "@/types/posts"; // Asegúrate de que la ruta sea correcta

const FormFromXML = () => {
  const [formData, setFormData] = useState({
    iTipEmi: "",
    dNumTim: "",
    dEst: "",
    dPunExp: "",
    dFeEmiDE: "",
    iTipTra: "",
    iTImp: "",
    cMoneOpe: "",
    dRucEm: "",
    dDVEmi: "",
    iTipCont: "",
    dNomRec: "",
    dRucRec: "",
    dDVRec: "",
    dVencPag: "",
  });

  useEffect(() => {
    const parseXML = async () => {
      const xml = posts[0].XML_RECEIVED; // Utilizando el primer post de ejemplo
      const parser = new xml2js.Parser();
      try {
        const result = await parser.parseStringPromise(xml);
        const de = result.rDE.DE[0];
        const gOpeDE = de.gOpeDE[0];
        const gTimb = de.gTimb[0];
        const gDatGralOpe = de.gDatGralOpe[0];
        const gOpeCom = gDatGralOpe.gOpeCom[0];
        const gEmis = gDatGralOpe.gEmis[0];
        const gDatRec = gDatGralOpe.gDatRec[0];
        const gDtipDE = de.gDtipDE[0];
        const gCamEsp = gDtipDE.gCamEsp[0];
        const gGrupAdi = gCamEsp.gGrupAdi[0];

        setFormData({
          iTipEmi: gOpeDE.iTipEmi[0],
          dNumTim: gTimb.dNumTim[0],
          dEst: gTimb.dEst[0],
          dPunExp: gTimb.dPunExp[0],
          dFeEmiDE: gDatGralOpe.dFeEmiDE[0],
          iTipTra: gOpeCom.iTipTra[0],
          iTImp: gOpeCom.iTImp[0],
          cMoneOpe: gOpeCom.cMoneOpe[0],
          dRucEm: gEmis.dRucEm[0],
          dDVEmi: gEmis.dDVEmi[0],
          iTipCont: gEmis.iTipCont[0],
          dNomRec: gDatRec.dNomRec[0],
          dRucRec: gDatRec.dRucRec[0],
          dDVRec: gDatRec.dDVRec[0],
          dVencPag: gGrupAdi.dVencPag[0],
        });
      } catch (error) {
        console.error("Error parsing XML:", error);
      }
    };

    parseXML();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Tipo de Emisión:</label>
        <input
          type="text"
          name="iTipEmi"
          value={formData.iTipEmi}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Número de Timbrado:</label>
        <input
          type="text"
          name="dNumTim"
          value={formData.dNumTim}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Establecimiento:</label>
        <input
          type="text"
          name="dEst"
          value={formData.dEst}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Punto de Expedición:</label>
        <input
          type="text"
          name="dPunExp"
          value={formData.dPunExp}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Fecha de Emisión:</label>
        <input
          type="text"
          name="dFeEmiDE"
          value={formData.dFeEmiDE}
          onChange={handleChange}
        />
      </div>
      {/* Agregar los demás campos aquí de forma similar */}
      <button type="submit">Enviar</button>
    </form>
  );
};

export default FormFromXML;
