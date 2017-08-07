(function() {
  var utils = {};

  utils.isString = function(val) {
    return val && typeof val === 'string';
  };
  

  utils.chop = function(str) {
    if (!utils.isString(str)) return '';
    var re = /^[-_.\W\s]+|[-_.\W\s]+$/g;
    return str.trim().replace(re, '');
  };

  utils.changecase = function(str, fn) {
    if (!utils.isString(str)) return '';
    if (str.length === 1) {
      return str.toLowerCase();
    }

    str = utils.chop(str).toLowerCase();
    if (typeof fn !== 'function') {
      fn = utils.identity;
    }

    var re = /[-_.\W\s]+(\w|$)/g;
    return str.replace(re, function(_, ch) {
      return fn(ch);
    });
  }
  
  function capitalize(str) {
    if (str && typeof str === 'string') {
      return str.charAt(0).toUpperCase()
        + str.slice(1);
    }
  }

  Handlebars.registerHelper('capitalize', capitalize);

  Handlebars.registerHelper('capitalizeAll', function(str) {
    if (str && typeof str === 'string') {
      return str.replace(/\w\S*/g, function(word) {
        return capitalize(word);
      });
    }
  });

  Handlebars.registerHelper('trim', function(str) {
    if (!val || typeof val !== 'string') return '';
    return str.trim();
  });

  Handlebars.registerHelper('uppercase', function(str, options) {
    if (str && typeof str === 'string') {
      return str.toUpperCase();
    } else {
      options = str;
    }
    if (typeof options === 'object' && options.fn) {
      return options.fn(this).toUpperCase();
    }
    return '';
  });

  Handlebars.registerHelper('formatDate', function(date, format) {
    if(!date) return '';

    if(moment) {
      return moment && moment(date).format(format);
    } else {
      // moment.js is not loaded. date format is ignored
      return date.toLocaleString();
    }
  });

  Handlebars.registerHelper('json', function(obj) {
    if(!obj) return '';

    return '<pre><code class="json">' + JSON.stringify(obj, null, 4) + '</code></pre>';
  });

  Handlebars.registerHelper('pascalcase', function(str) {
    str = utils.changecase(str, function(ch) {
      return ch.toUpperCase();
    });
    return str.charAt(0).toUpperCase()
      + str.slice(1);
  });

  Handlebars.registerHelper('math', function(lvalue, operator, rvalue, options) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
        
    return {
        '+': lvalue + rvalue,
        '-': lvalue - rvalue,
        '*': lvalue * rvalue,
        '/': lvalue / rvalue,
        '%': lvalue % rvalue
    }[operator];
  });

  Handlebars.registerHelper('join', function(array, sep) {
    if (!array || !array.length) return '';
    sep = typeof sep !== 'string'
      ? ', '
      : sep;
    return array.join && array.join(sep) || array;
  });

  function when (v1, operator, v2, options) {
    switch (operator) {
      case '==':
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
        return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
      }
  }

  Handlebars.registerHelper('when', when);

  Handlebars.registerHelper('whenListItem', function(v1, index, operator, v2, options) {
    return when(v1 && v1[parseInt(index)], operator, v2, options);
  });

  Handlebars.registerHelper('selectListItem', function(list, index, options) {
    var item = list && list[parseInt(index)] || null;
    
    if(item && options.hash.field) {
      return item[options.hash.field];
    } else {
      return item;
    }
  });

  Handlebars.registerHelper("inc", function(value, options) {
      return parseInt(value) + 1;
  });
  
})();
