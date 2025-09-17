"use strict";
/**
 * Business Type Classifier
 * Intelligently detects the type of business from website content
 * and adapts extraction strategies accordingly
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessClassifier = exports.BusinessType = void 0;
var BusinessType;
(function (BusinessType) {
    BusinessType["ECOMMERCE"] = "ecommerce";
    BusinessType["REAL_ESTATE"] = "real_estate";
    BusinessType["HEALTHCARE"] = "healthcare";
    BusinessType["LEGAL"] = "legal";
    BusinessType["EDUCATION"] = "education";
    BusinessType["RESTAURANT"] = "restaurant";
    BusinessType["AUTOMOTIVE"] = "automotive";
    BusinessType["FINANCIAL"] = "financial";
    BusinessType["HOSPITALITY"] = "hospitality";
    BusinessType["PROFESSIONAL_SERVICES"] = "professional_services";
    BusinessType["UNKNOWN"] = "unknown";
})(BusinessType || (exports.BusinessType = BusinessType = {}));
var BusinessClassifier = /** @class */ (function () {
    function BusinessClassifier() {
    }
    /**
     * Analyze website content to determine business type
     */
    BusinessClassifier.classifyBusiness = function (domain, sampleContent, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var fullContent, classifications, bestMatch;
            return __generator(this, function (_a) {
                fullContent = sampleContent.join(' ').toLowerCase();
                classifications = [
                    this.checkEcommerce(fullContent, metadata),
                    this.checkRealEstate(fullContent, metadata),
                    this.checkHealthcare(fullContent, metadata),
                    this.checkLegal(fullContent, metadata),
                    this.checkEducation(fullContent, metadata),
                    this.checkRestaurant(fullContent, metadata),
                    this.checkAutomotive(fullContent, metadata),
                    this.checkFinancial(fullContent, metadata),
                    this.checkHospitality(fullContent, metadata),
                ];
                bestMatch = classifications.reduce(function (best, current) {
                    return current.confidence > best.confidence ? current : best;
                });
                // If confidence is too low, classify as professional services
                if (bestMatch.confidence < 0.3) {
                    return [2 /*return*/, this.getProfessionalServicesClassification(fullContent)];
                }
                return [2 /*return*/, bestMatch];
            });
        });
    };
    BusinessClassifier.checkEcommerce = function (content, metadata) {
        var indicators = [];
        var score = 0;
        // Strong indicators
        if (content.includes('add to cart')) {
            indicators.push('add to cart');
            score += 0.3;
        }
        if (content.includes('checkout')) {
            indicators.push('checkout');
            score += 0.2;
        }
        if (content.includes('shopping cart')) {
            indicators.push('shopping cart');
            score += 0.2;
        }
        if (/\$\d+\.\d{2}/.test(content)) {
            indicators.push('price format');
            score += 0.1;
        }
        if (content.includes('sku:')) {
            indicators.push('SKU');
            score += 0.2;
        }
        if (content.includes('in stock')) {
            indicators.push('stock status');
            score += 0.2;
        }
        if (content.includes('product')) {
            indicators.push('product mentions');
            score += 0.1;
        }
        return {
            primaryType: BusinessType.ECOMMERCE,
            confidence: Math.min(score, 1),
            indicators: indicators,
            suggestedSchema: {
                primaryEntity: 'product',
                identifierField: 'sku',
                availabilityField: 'in_stock',
                priceField: 'price',
                customFields: {
                    brand: 'brand',
                    category: 'category',
                    shipping: 'shipping_info'
                }
            },
            extractionStrategy: {
                priorityFields: ['name', 'price', 'sku', 'availability', 'description'],
                patterns: {
                    price: /\$[\d,]+\.?\d*/,
                    sku: /SKU[:\s]*([A-Z0-9-]+)/i,
                    stock: /(in stock|out of stock|available|unavailable)/i
                },
                specialProcessing: ['variants', 'reviews', 'specifications']
            },
            terminology: {
                entityName: 'product',
                entityNamePlural: 'products',
                availableText: 'in stock',
                unavailableText: 'out of stock',
                priceLabel: 'price',
                searchPrompt: 'Search products'
            }
        };
    };
    BusinessClassifier.checkRealEstate = function (content, metadata) {
        var indicators = [];
        var score = 0;
        // Strong indicators
        if (content.includes('bedroom')) {
            indicators.push('bedrooms');
            score += 0.25;
        }
        if (content.includes('bathroom')) {
            indicators.push('bathrooms');
            score += 0.25;
        }
        if (content.includes('sqft') || content.includes('square feet')) {
            indicators.push('square footage');
            score += 0.2;
        }
        if (content.includes('mls')) {
            indicators.push('MLS');
            score += 0.3;
        }
        if (content.includes('listing')) {
            indicators.push('listings');
            score += 0.2;
        }
        if (content.includes('for sale') || content.includes('for rent')) {
            indicators.push('sale/rent');
            score += 0.2;
        }
        if (content.includes('realtor') || content.includes('agent')) {
            indicators.push('realtor/agent');
            score += 0.15;
        }
        return {
            primaryType: BusinessType.REAL_ESTATE,
            confidence: Math.min(score, 1),
            indicators: indicators,
            suggestedSchema: {
                primaryEntity: 'property',
                identifierField: 'mls_number',
                availabilityField: 'status',
                priceField: 'price',
                customFields: {
                    bedrooms: 'bedrooms',
                    bathrooms: 'bathrooms',
                    sqft: 'square_feet',
                    address: 'address',
                    type: 'property_type'
                }
            },
            extractionStrategy: {
                priorityFields: ['address', 'price', 'bedrooms', 'bathrooms', 'sqft'],
                patterns: {
                    price: /\$[\d,]+/,
                    bedrooms: /(\d+)\s*(?:bed|br|bedroom)/i,
                    bathrooms: /(\d+\.?\d*)\s*(?:bath|ba|bathroom)/i,
                    sqft: /(\d+,?\d*)\s*(?:sqft|sq\.?\s*ft)/i
                },
                specialProcessing: ['virtual_tour', 'neighborhood', 'schools']
            },
            terminology: {
                entityName: 'property',
                entityNamePlural: 'properties',
                availableText: 'available',
                unavailableText: 'sold',
                priceLabel: 'price',
                searchPrompt: 'Search properties'
            }
        };
    };
    BusinessClassifier.checkHealthcare = function (content, metadata) {
        var indicators = [];
        var score = 0;
        if (content.includes('doctor') || content.includes('physician')) {
            indicators.push('doctors');
            score += 0.25;
        }
        if (content.includes('patient')) {
            indicators.push('patients');
            score += 0.2;
        }
        if (content.includes('appointment')) {
            indicators.push('appointments');
            score += 0.25;
        }
        if (content.includes('medical') || content.includes('health')) {
            indicators.push('medical/health');
            score += 0.15;
        }
        if (content.includes('insurance')) {
            indicators.push('insurance');
            score += 0.15;
        }
        if (content.includes('treatment') || content.includes('procedure')) {
            indicators.push('treatments');
            score += 0.2;
        }
        return {
            primaryType: BusinessType.HEALTHCARE,
            confidence: Math.min(score, 1),
            indicators: indicators,
            suggestedSchema: {
                primaryEntity: 'service',
                identifierField: 'service_code',
                availabilityField: 'available',
                priceField: 'fee',
                customFields: {
                    provider: 'provider_name',
                    specialty: 'specialty',
                    insurance: 'insurance_accepted',
                    duration: 'appointment_duration'
                }
            },
            extractionStrategy: {
                priorityFields: ['service_name', 'provider', 'specialty', 'insurance'],
                patterns: {
                    phone: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
                    hours: /\d{1,2}:\d{2}\s*(am|pm)/i
                },
                specialProcessing: ['insurance_plans', 'locations', 'emergency_services']
            },
            terminology: {
                entityName: 'service',
                entityNamePlural: 'services',
                availableText: 'available',
                unavailableText: 'unavailable',
                priceLabel: 'fee',
                searchPrompt: 'Find services'
            }
        };
    };
    BusinessClassifier.checkLegal = function (content, metadata) {
        var indicators = [];
        var score = 0;
        if (content.includes('attorney') || content.includes('lawyer')) {
            indicators.push('attorneys');
            score += 0.3;
        }
        if (content.includes('law firm')) {
            indicators.push('law firm');
            score += 0.3;
        }
        if (content.includes('legal')) {
            indicators.push('legal');
            score += 0.2;
        }
        if (content.includes('case') || content.includes('litigation')) {
            indicators.push('cases');
            score += 0.15;
        }
        if (content.includes('consultation')) {
            indicators.push('consultation');
            score += 0.15;
        }
        return {
            primaryType: BusinessType.LEGAL,
            confidence: Math.min(score, 1),
            indicators: indicators,
            suggestedSchema: {
                primaryEntity: 'service',
                identifierField: 'service_id',
                availabilityField: 'accepting_clients',
                priceField: 'consultation_fee',
                customFields: {
                    practice_area: 'practice_area',
                    attorney: 'attorney_name',
                    experience: 'years_experience'
                }
            },
            extractionStrategy: {
                priorityFields: ['practice_area', 'attorney_name', 'consultation_fee'],
                patterns: {
                    phone: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
                    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
                },
                specialProcessing: ['case_results', 'testimonials', 'bar_admissions']
            },
            terminology: {
                entityName: 'service',
                entityNamePlural: 'services',
                availableText: 'accepting clients',
                unavailableText: 'not accepting clients',
                priceLabel: 'consultation fee',
                searchPrompt: 'Find legal services'
            }
        };
    };
    BusinessClassifier.checkEducation = function (content, metadata) {
        var indicators = [];
        var score = 0;
        if (content.includes('course') || content.includes('class')) {
            indicators.push('courses');
            score += 0.25;
        }
        if (content.includes('student')) {
            indicators.push('students');
            score += 0.2;
        }
        if (content.includes('tuition')) {
            indicators.push('tuition');
            score += 0.25;
        }
        if (content.includes('enrollment') || content.includes('enroll')) {
            indicators.push('enrollment');
            score += 0.2;
        }
        if (content.includes('degree') || content.includes('certificate')) {
            indicators.push('degrees');
            score += 0.2;
        }
        return {
            primaryType: BusinessType.EDUCATION,
            confidence: Math.min(score, 1),
            indicators: indicators,
            suggestedSchema: {
                primaryEntity: 'course',
                identifierField: 'course_code',
                availabilityField: 'enrollment_open',
                priceField: 'tuition',
                customFields: {
                    instructor: 'instructor',
                    credits: 'credit_hours',
                    schedule: 'schedule',
                    prerequisites: 'prerequisites'
                }
            },
            extractionStrategy: {
                priorityFields: ['course_name', 'instructor', 'schedule', 'tuition'],
                patterns: {
                    courseCode: /[A-Z]{2,4}\s*\d{3,4}/,
                    credits: /(\d+)\s*credit/i
                },
                specialProcessing: ['prerequisites', 'syllabus', 'registration']
            },
            terminology: {
                entityName: 'course',
                entityNamePlural: 'courses',
                availableText: 'open for enrollment',
                unavailableText: 'closed',
                priceLabel: 'tuition',
                searchPrompt: 'Search courses'
            }
        };
    };
    BusinessClassifier.checkRestaurant = function (content, metadata) {
        var indicators = [];
        var score = 0;
        if (content.includes('menu')) {
            indicators.push('menu');
            score += 0.3;
        }
        if (content.includes('reservation')) {
            indicators.push('reservations');
            score += 0.2;
        }
        if (content.includes('cuisine') || content.includes('food')) {
            indicators.push('cuisine/food');
            score += 0.2;
        }
        if (content.includes('takeout') || content.includes('delivery')) {
            indicators.push('takeout/delivery');
            score += 0.15;
        }
        if (content.includes('hours') && content.includes('open')) {
            indicators.push('hours');
            score += 0.1;
        }
        return {
            primaryType: BusinessType.RESTAURANT,
            confidence: Math.min(score, 1),
            indicators: indicators,
            suggestedSchema: {
                primaryEntity: 'menu_item',
                identifierField: 'item_code',
                availabilityField: 'available',
                priceField: 'price',
                customFields: {
                    category: 'category',
                    description: 'description',
                    dietary: 'dietary_info',
                    ingredients: 'ingredients'
                }
            },
            extractionStrategy: {
                priorityFields: ['item_name', 'price', 'description', 'category'],
                patterns: {
                    price: /\$[\d,]+\.?\d*/,
                    dietary: /(vegan|vegetarian|gluten-free|dairy-free)/i
                },
                specialProcessing: ['specials', 'hours', 'delivery_info']
            },
            terminology: {
                entityName: 'menu item',
                entityNamePlural: 'menu items',
                availableText: 'available',
                unavailableText: 'not available',
                priceLabel: 'price',
                searchPrompt: 'Browse menu'
            }
        };
    };
    BusinessClassifier.checkAutomotive = function (content, metadata) {
        var indicators = [];
        var score = 0;
        if (content.includes('vehicle') || content.includes('car')) {
            indicators.push('vehicles');
            score += 0.25;
        }
        if (content.includes('vin')) {
            indicators.push('VIN');
            score += 0.3;
        }
        if (content.includes('mileage') || content.includes('miles')) {
            indicators.push('mileage');
            score += 0.2;
        }
        if (content.includes('model') && content.includes('make')) {
            indicators.push('make/model');
            score += 0.2;
        }
        return {
            primaryType: BusinessType.AUTOMOTIVE,
            confidence: Math.min(score, 1),
            indicators: indicators,
            suggestedSchema: {
                primaryEntity: 'vehicle',
                identifierField: 'vin',
                availabilityField: 'status',
                priceField: 'price',
                customFields: {
                    make: 'make',
                    model: 'model',
                    year: 'year',
                    mileage: 'mileage',
                    condition: 'condition'
                }
            },
            extractionStrategy: {
                priorityFields: ['make', 'model', 'year', 'price', 'mileage'],
                patterns: {
                    vin: /[A-HJ-NPR-Z0-9]{17}/,
                    year: /(19|20)\d{2}/,
                    mileage: /(\d+,?\d*)\s*miles/i
                },
                specialProcessing: ['features', 'history', 'warranty']
            },
            terminology: {
                entityName: 'vehicle',
                entityNamePlural: 'vehicles',
                availableText: 'available',
                unavailableText: 'sold',
                priceLabel: 'price',
                searchPrompt: 'Search vehicles'
            }
        };
    };
    BusinessClassifier.checkFinancial = function (content, metadata) {
        var indicators = [];
        var score = 0;
        if (content.includes('account')) {
            indicators.push('accounts');
            score += 0.2;
        }
        if (content.includes('loan') || content.includes('mortgage')) {
            indicators.push('loans');
            score += 0.25;
        }
        if (content.includes('rate') || content.includes('apr')) {
            indicators.push('rates');
            score += 0.2;
        }
        if (content.includes('investment') || content.includes('banking')) {
            indicators.push('financial services');
            score += 0.2;
        }
        return {
            primaryType: BusinessType.FINANCIAL,
            confidence: Math.min(score, 1),
            indicators: indicators,
            suggestedSchema: {
                primaryEntity: 'service',
                identifierField: 'service_code',
                availabilityField: 'available',
                priceField: 'fee',
                customFields: {
                    type: 'service_type',
                    rate: 'interest_rate',
                    term: 'term_length',
                    requirements: 'requirements'
                }
            },
            extractionStrategy: {
                priorityFields: ['service_name', 'rate', 'fees', 'requirements'],
                patterns: {
                    rate: /\d+\.?\d*%/,
                    fee: /\$[\d,]+/
                },
                specialProcessing: ['calculators', 'eligibility', 'disclosures']
            },
            terminology: {
                entityName: 'service',
                entityNamePlural: 'services',
                availableText: 'available',
                unavailableText: 'unavailable',
                priceLabel: 'fee',
                searchPrompt: 'Find services'
            }
        };
    };
    BusinessClassifier.checkHospitality = function (content, metadata) {
        var indicators = [];
        var score = 0;
        if (content.includes('room') || content.includes('suite')) {
            indicators.push('rooms');
            score += 0.25;
        }
        if (content.includes('booking') || content.includes('reservation')) {
            indicators.push('bookings');
            score += 0.25;
        }
        if (content.includes('check-in') || content.includes('checkout')) {
            indicators.push('check-in/out');
            score += 0.2;
        }
        if (content.includes('amenities')) {
            indicators.push('amenities');
            score += 0.15;
        }
        return {
            primaryType: BusinessType.HOSPITALITY,
            confidence: Math.min(score, 1),
            indicators: indicators,
            suggestedSchema: {
                primaryEntity: 'room',
                identifierField: 'room_number',
                availabilityField: 'availability',
                priceField: 'rate',
                customFields: {
                    type: 'room_type',
                    capacity: 'max_occupancy',
                    amenities: 'amenities',
                    view: 'view_type'
                }
            },
            extractionStrategy: {
                priorityFields: ['room_type', 'rate', 'availability', 'amenities'],
                patterns: {
                    rate: /\$[\d,]+/,
                    dates: /\d{1,2}\/\d{1,2}\/\d{2,4}/
                },
                specialProcessing: ['availability_calendar', 'packages', 'policies']
            },
            terminology: {
                entityName: 'room',
                entityNamePlural: 'rooms',
                availableText: 'available',
                unavailableText: 'booked',
                priceLabel: 'rate',
                searchPrompt: 'Search rooms'
            }
        };
    };
    BusinessClassifier.getProfessionalServicesClassification = function (content) {
        return {
            primaryType: BusinessType.PROFESSIONAL_SERVICES,
            confidence: 0.5,
            indicators: ['generic business content'],
            suggestedSchema: {
                primaryEntity: 'service',
                identifierField: 'service_id',
                availabilityField: 'available',
                priceField: 'price',
                customFields: {
                    description: 'description',
                    duration: 'duration',
                    category: 'category'
                }
            },
            extractionStrategy: {
                priorityFields: ['service_name', 'description', 'price', 'contact'],
                patterns: {
                    price: /\$[\d,]+\.?\d*/,
                    phone: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
                    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
                },
                specialProcessing: ['team', 'portfolio', 'testimonials']
            },
            terminology: {
                entityName: 'service',
                entityNamePlural: 'services',
                availableText: 'available',
                unavailableText: 'unavailable',
                priceLabel: 'price',
                searchPrompt: 'Find services'
            }
        };
    };
    return BusinessClassifier;
}());
exports.BusinessClassifier = BusinessClassifier;
