const gulp = require('gulp');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const sourceMaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const pngquant = require('imagemin-pngquant');
const del = require('del');
const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');

gulp.task('sass', function (done) {
  return gulp.src('scss/styles.scss')
    .pipe(plumber()) // plumber будет обрабатывать ошибки и выводить их в консоль
    .pipe(sourceMaps.init())
    .pipe(sass()) // преобразование в css
    .pipe(autoprefixer({ // расстановка автопрефиксов
      browsers: ['last 2 version']
    }))
    .pipe(sourceMaps.write()) // записываем sourceMaps
    .pipe(gulp.dest('./build/css/')) // сохраняем преобразованный файл в указанную папку
    .pipe(browserSync.reload({ stream: true }))
    .on('end', done);
});

gulp.task('html', function (done) {
  return gulp.src('*.html') // находим все html-файлы
    .pipe(gulp.dest('build')) // все найденные файлы переносятся в папку build
    .pipe(browserSync.reload({ stream: true }))
    .on('end', done);
});

gulp.task('js', function (done) {
  return gulp.src('js/**/*.js')
    .pipe(gulp.dest('./build/js/'))
    .pipe(browserSync.reload({ stream: true }))
    .on('end', done);
});

gulp.task('css', function (done) {
  return gulp.src('css/**/*.css')
    .pipe(gulp.dest('./build/css/'))
    .pipe(browserSync.reload({ stream: true }))
    .on('end', done);
});

gulp.task('allimages', function (done) {
  return gulp.src('img/**/*.{png,jpg}')
    .pipe(gulp.dest('./build/img/'))
    .pipe(browserSync.reload({ stream: true }))
    .on('end', done);
});

// Создаем задачу для сжатия изображений в папк build/img
gulp.task('imagesmin', function (done) {
  return gulp.src('./build/img/**/*.{png,jpg}')
    .pipe(imagemin([
      imagemin.jpegtran({
        progressive: true
      }),
      imageminJpegRecompress({
        loops: 5,
        min: 65,
        max: 70,
        quality: 'medium'
      }),
      imagemin.optipng({
        optimizationLevel: 3
      }),
      pngquant({
        //quality: [65, 70],
        quality: [0.7, 0.8],
        speed: 5
      })
    ]))
    .pipe(gulp.dest('./build/img'))
    .pipe(browserSync.reload({ stream: true }))
    .on('end', done);
});

gulp.task('svg', function (done) {
  return gulp.src('./img/**/*.svg') // находим все svg-файлы
    .pipe(svgmin({ // модуль svgmin минифицирует найденные файлы
      js2svg: {
        pretty: true
      }
    }))
    .pipe(cheerio({ // удяляем атрибуты из самого svg-файла
      run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(replace('&gt;', '>')) // заменяем &gt; на знак >
    .pipe(svgSprite({ // создаем svg-спрайт из всех найденных файлов
      mode: {
        symbol: {
          sprite: "sprite.svg"
        }
      }
    }))
    .pipe(gulp.dest('./build/img/'))
    .on('end', done);
});

gulp.task('serve', function (done) {
  browserSync.init({
    server: "build"
  });

  // Если наблюдаемые файлы будут меняться, то будем запускать соответствующие таски
  gulp.watch("scss/**/*.scss", gulp.series(["sass"]));
  gulp.watch("*.html", gulp.series(["html"]));
  gulp.watch("js/**/*.js", gulp.series(["js"]));
  gulp.watch("css/**/*.css", gulp.series(["css"]));
  gulp.watch("img/**/*.{png,jpg}", gulp.series(["allimages"]));
  gulp.watch("img/**/*.{svg}", gulp.series(["svg"]));

  done();
});

gulp.task('copy', function (done) {
  return gulp.src([
    'img/**',
    'js/**',
    'css/**',
    '*.html'
  ], {
      base: '.'
    })
    .pipe(gulp.dest('build'))
    .on('end', done);
});

gulp.task('clean', function () {
  return del('build');
});

gulp.task('build', gulp.series([
  'clean',
  'copy',
  'sass',
  'imagesmin',
  'svg'
]));

// В файле package.json создаем команду "start": "npm run build && gulp serve"
// Запуск данной команды: npm start
// Будет запущен сначала таск build