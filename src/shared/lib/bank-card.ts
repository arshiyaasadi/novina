import bankConfig from "@/../public/images/bankLogos/bankList.json";

type BankListEntry = {
  id: string;
  bankName: string;
  iBan?: string;
  prefixes: string[];
  logo: string;
  bgColor: string;
  textColor: string;
};

type BankJson = {
  title?: string;
  bankList: BankListEntry[];
};

const { bankList } = (bankConfig as BankJson);

const bankLists: BankListEntry[] = Array.isArray(bankList) ? bankList : [];

const defaultBank: BankListEntry = {
  id: "pasinno",
  bankName: "",
  prefixes: [],
  logo: "pasinno.png",
  bgColor: "#0458bc",
  textColor: "#ffffff",
};

const normalizePan = (pan: string): string => pan.replace(/\D/g, "");

const handlerBank = (cardNumber: string): BankListEntry => {
  const pan = normalizePan(cardNumber);
  if (!pan) return defaultBank;

  const resBank = bankLists.find((data) =>
    data.prefixes.some((prefix) => pan.startsWith(prefix))
  );

  return resBank ? { ...resBank } : defaultBank;
};

const maskPanHandler = (pan: string): string => {
  const normalized = normalizePan(pan);
  return normalized.length === 16
    ? normalized.substring(12) + "******" + normalized.substring(0, 4)
    : normalized;
};

export { handlerBank, maskPanHandler, type BankListEntry };

