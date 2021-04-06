class SegmentsViewer {
    constructor(node, segmentTypesCount) {
        this.node = node;
        this.segmentTypesCount = segmentTypesCount;
        this.twilioLogo = this.createTwilioLogo();
        this.blockMap = new Map();
        this.selectedBlocks = [];
    }

    createTwilioLogo() {
        let img = document.createElement('img');
        const twilio_logo = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg class="icon" width="200px" height="200.00px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path fill="#000000" d="M429.056 532.992c-48.64 48.64-96.768 93.696-145.408 141.824-20.992 20.992-48.64-10.24-31.232-31.232 41.472-41.472 86.528-82.944 128-124.416-45.056-41.472-86.528-86.528-131.584-128-20.992-20.992 10.24-51.712 31.232-31.232l145.408 145.408c10.24 3.072 10.24 20.48 3.584 27.648zM594.944 501.76l145.408-145.408c20.992-20.992 51.712 10.24 31.232 31.232-45.056 41.472-86.528 86.528-131.584 128 41.472 41.472 86.528 82.944 128 124.416 20.992 20.992-10.24 51.712-31.232 31.232-48.64-48.64-96.768-93.696-145.408-141.824-3.072-3.584-3.072-20.992 3.584-27.648zM508.416 908.8c-10.24 0-20.992-22.016-20.992-50.176V147.456c0-28.16 10.24-50.176 20.992-50.176 10.24 0 20.992 22.016 20.992 50.176v711.168c0 28.16-10.24 50.176-20.992 50.176z"  /></svg>';
        img.setAttribute("src", "data:image/svg+xml;base64," + btoa(twilio_logo));
        return img;
    }

    createTwilioReservedCodeUnitBlock(segmentType) {
        let block = document.createElement("div");
        block.setAttribute("class", `block twilio ${segmentType}`);
        let twilioLogo = this.twilioLogo.cloneNode();
        block.appendChild(twilioLogo);
        return block;
    }

    createCodeUnitBlock(codeUnit, segmentType, mapKey, isGSM7) {
        let block = document.createElement('div');
        block.setAttribute('class', `block ${segmentType} ${isGSM7 ? '' : 'non-gsm'}`);

        block.setAttribute("data-key", mapKey);
        this.blockMap.get(mapKey).push(block);

        let span = document.createElement('span');
        span.textContent = "0x" + codeUnit.toString(16).padStart(4, '0').toUpperCase();

        block.appendChild(span);
        return block;
    }

    update(segmentedMessage) {
        this.blockMap.clear();

        let newSegments = document.createElement("div");
        newSegments.setAttribute("id", "segments-viewer");

        for (let segmentIndex = 0; segmentIndex < segmentedMessage.segments.length; segmentIndex++) {
            const segmentType = `segment-type-${segmentIndex % this.segmentTypesCount}`;
            const segment = segmentedMessage.segments[segmentIndex];

            for (let charIndex = 0; charIndex < segment.length; charIndex++) {
                const encodedChar = segment[charIndex];
                const mapKey = `${segmentIndex}-${charIndex}`;
                this.blockMap.set(mapKey, []);

                if (encodedChar instanceof TwilioReservedChar) {
                    newSegments.appendChild(this.createTwilioReservedCodeUnitBlock(segmentType));
                } else {
                    if (encodedChar.codeUnits) {
                        for (const codeUnit of encodedChar.codeUnits) {
                            newSegments.appendChild(
                                this.createCodeUnitBlock(codeUnit, segmentType, mapKey, encodedChar.isGSM7)
                            );
                        }
                    }
                }
            }
        }

        this.node.replaceWith(newSegments);
        this.node = newSegments;
    }

    select(mapKey) {
        this.clearSelection();

        for (let block of this.blockMap.get(mapKey)) {
            block.classList.add("selected");
            this.selectedBlocks.push(block);
        }
    }

    clearSelection() {
        for (let block of this.selectedBlocks) {
            block.classList.remove("selected");
        }

        this.selectedBlocks.length = 0;
    }
}


class MessageViewer {
    constructor(node, segmentTypesCount) {
        this.node = node;
        this.segmentTypesCount = segmentTypesCount;
        this.blockMap = new Map();
        this.selectedBlock = null;
    }

    createCharBlock(encodedChar, segmentType, mapKey) {
        let block = document.createElement('div');
        block.setAttribute('class', `block ${segmentType}`);
        if (!encodedChar.codeUnits) {
            block.classList.add('error');
        }

        block.setAttribute("data-key", mapKey);
        this.blockMap.set(mapKey, block);

        let span = document.createElement('span');
        span.textContent = encodedChar.raw.replace(' ', '\u00A0');
        block.appendChild(span);
        return block;
    }

    update(segmentedMessage) {
        this.blockMap.clear();
        let newMessage = document.createElement("div");
        newMessage.setAttribute("id", "message-viewer");

        for (let segmentIndex = 0; segmentIndex < segmentedMessage.segments.length; segmentIndex++) {
            const segmentType = `segment-type-${segmentIndex % this.segmentTypesCount}`;
            const segment = segmentedMessage.segments[segmentIndex];

            for (let charIndex = 0; charIndex < segment.length; charIndex++) {
                const encodedChar = segment[charIndex];
                const mapKey = `${segmentIndex}-${charIndex}`;

                if (!(encodedChar instanceof TwilioReservedChar)) {
                    newMessage.appendChild(this.createCharBlock(encodedChar, segmentType, mapKey));
                }
            }
        }

        this.node.replaceWith(newMessage);
        this.node = newMessage;

        this.markInvisibleCharacters();
    }

    markInvisibleCharacters() {
        for (let span of this.node.querySelectorAll("span")) {
            if (span.offsetWidth === 0) {
                span.classList.add("invisible");
            }
        }
    }

    select(mapKey) {
        this.clearSelection();

        this.selectedBlock = this.blockMap.get(mapKey);
        this.selectedBlock.classList.add("selected");
    }

    clearSelection() {
        if (this.selectedBlock) {
            this.selectedBlock.classList.remove("selected");
        }
        this.selectedBlock = null;        
    }
}
