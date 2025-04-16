import moduleAlias from 'module-alias';

// This needs to be done as soon as possible in the loading process...

const isEmulator = !!process.env.FIREBASE_EMULATOR_HUB || !!process.env.FUNCTIONS_EMULATOR;
moduleAlias.addAliases({
  // In Emulator (dev mode) it's easier to directly reference shared/dist folder (so that we don't need to copy its content into lib/shared/ folder)
  '@shared': isEmulator ? `${__dirname}/../../../../shared/dist`:`${__dirname}/../shared`,
})
