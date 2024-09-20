export interface Post {
  INVOICE_ID: number;
  TRACE_ID: string;
  DOCUMENT_NUMBER: number;
  D_NUM_TIMB: number;
  D_EST: string;
  D_PUNEXP: string;
  D_NUM_DOC: number;
  D_SERIE: string;
  D_FE_EMI_DE: string;
  CDC: string;
  XML_RECEIVED: XML;
  XML_SENT: XML;
  CREATION_DATE: string;
  STATUS: string;
  RETRY_TIMES: number;
  RESULT_STATUS: string;
  RESULT_MSG: string;
  GENERATED_DE_ID: number;
  INVOICE_STATUS: string;
  INVOICE_STATUS_MSG: string;
  LENDING_UPDATED: string;
  LENDING_UPDATE_STATUS: string;
  LENDING_MSG: string;
  SET_RESPONSE_CODE: number;
  SET_RESPONSE_MSG: string;
  D_FE_EMI_DE_BK: string;
}

export interface XML {
  dRucEm: string;
  dNomRec: string;
}
