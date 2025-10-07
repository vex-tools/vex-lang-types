declare module "vex-std/iostream" {
    interface IO {
        /**
         * Output a message in console.
         * @param message The message to output.
         */
        cout(message: string): void;

        /**
         * Get an input of user from console.
         * @returns The input as string.
         */
        cin(): string;
    }

    const io: IO;
    export default io;
}