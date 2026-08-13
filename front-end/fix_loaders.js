const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
        if (!dirPath.includes('node_modules') && !dirPath.includes('.next')) {
            walkDir(dirPath, callback);
        }
    } else if (dirPath.endsWith('.tsx')) {
        callback(dirPath);
    }
  });
}

const targetDir = path.resolve('c:/Personal/Documents/SLIIT/Top Up/SEMESTER 2/Undergraduate Project/Assignment/bonded/BondEd/front-end/app');

walkDir(targetDir, file => {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // 1. Standardize page loaders block
  const pageLoaderRegex = /<\s*div[^>]*className="[^"]*flex flex-col items-center justify-center min-h-\[60vh\][^"]*"[^>]*>\s*<\s*DotsRing[^>]*\/>\s*<\s*p[^>]*>([^<]+)<\/p>\s*<\/div>/g;
  
  content = content.replace(pageLoaderRegex, (match, loadingText) => {
    return `<div className="min-h-[60vh] flex flex-col items-center justify-center">
        <DotsRing className="mb-4 text-[#9C2FDF] w-8 h-8" />
        <p className="text-gray-500 font-medium text-sm">${loadingText}</p>
      </div>`;
  });
  
  // also handle the case where classNames might be ordered differently
  const pageLoaderRegex2 = /<\s*div[^>]*className="[^"]*min-h-\[60vh\][^"]*flex flex-col items-center justify-center[^"]*"[^>]*>\s*<\s*DotsRing[^>]*\/>\s*<\s*p[^>]*>([^<]+)<\/p>\s*<\/div>/g;
  content = content.replace(pageLoaderRegex2, (match, loadingText) => {
    return `<div className="min-h-[60vh] flex flex-col items-center justify-center">
        <DotsRing className="mb-4 text-[#9C2FDF] w-8 h-8" />
        <p className="text-gray-500 font-medium text-sm">${loadingText}</p>
      </div>`;
  });

  // Handle FindPartners tab loaders which are slightly different
  const tabLoaderRegex = /if \(loading\) return <div className="py-10 text-center"><DotsRing[^>]*\/><\/div>;/g;
  content = content.replace(tabLoaderRegex, `if (loading) return (
    <div className="py-10 flex flex-col items-center justify-center">
      <DotsRing className="mb-4 text-[#9C2FDF] w-8 h-8" />
      <p className="text-gray-500 font-medium text-sm">Loading...</p>
    </div>
  );`);

  // 2. Standardize all other DotsRing colors to #9C2FDF (purple), UNLESS it is text-white.
  content = content.replace(/<DotsRing\s+className="([^"]*)"/g, (match, classNames) => {
    let newClasses = classNames;
    if (!newClasses.includes('text-white')) {
      newClasses = newClasses.replace(/text-(?:\[#[a-fA-F0-9]+\]|violet-\d+|purple-\d+|blue-\d+)/g, '');
      if (!newClasses.includes('text-[#9C2FDF]')) {
        newClasses = `text-[#9C2FDF] ${newClasses}`.trim();
      }
    }
    newClasses = newClasses.replace(/w-16 h-16/g, 'w-8 h-8');
    
    // clean up multiple spaces
    newClasses = newClasses.replace(/\s+/g, ' ');

    return `<DotsRing className="${newClasses}"`;
  });

  // Ensure Dashboard is consistent
  if (file.includes('Dashboard\\\\page.tsx') || file.includes('Dashboard/page.tsx')) {
    content = content.replace(/<p className="text-gray-500 font-medium">Loading your dashboard...<\/p>/, '<p className="text-gray-500 font-medium text-sm">Loading Dashboard...</p>');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Updated: ' + file);
  }
});
console.log('Done.');
