import { QRCodeCanvas } from "qrcode.react";

export default function QRRender({ id }) {
    return (
        <QRCodeCanvas
            value={id}
            size={256}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"H"}
        />
    );
}
