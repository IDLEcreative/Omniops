"use strict";
/**
 * Adaptive Entity Extractor
 * Extracts structured data based on detected business type
 * Works with any industry, not just e-commerce
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveEntityExtractor = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
var openai_1 = __importDefault(require("openai"));
var business_classifier_1 = require("./business-classifier");
var AdaptiveEntityExtractor = /** @class */ (function () {
    function AdaptiveEntityExtractor(supabaseUrl, supabaseKey, openaiKey) {
        this.businessClassification = null;
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        this.openai = new openai_1.default({ apiKey: openaiKey });
    }
    /**
     * Initialize extractor for a domain by detecting business type
     */
    AdaptiveEntityExtractor.prototype.initializeForDomain = function (domainId) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, pages, sampleContent, classification;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.supabase
                            .from('business_classifications')
                            .select('*')
                            .eq('domain_id', domainId)
                            .single()];
                    case 1:
                        existing = (_c.sent()).data;
                        if (existing && existing !== null) {
                            this.businessClassification = {
                                primaryType: existing.business_type,
                                confidence: existing.confidence,
                                indicators: existing.indicators,
                                suggestedSchema: (_a = existing.extraction_config) === null || _a === void 0 ? void 0 : _a.schema,
                                extractionStrategy: (_b = existing.extraction_config) === null || _b === void 0 ? void 0 : _b.strategy,
                                terminology: existing.entity_terminology
                            };
                            console.log("Using existing classification: ".concat(existing.business_type));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.supabase
                                .from('scraped_pages')
                                .select('content, metadata')
                                .eq('domain_id', domainId)
                                .limit(5)];
                    case 2:
                        pages = (_c.sent()).data;
                        if (!pages || pages.length === 0) {
                            console.error('No pages found for classification');
                            return [2 /*return*/];
                        }
                        sampleContent = pages.map(function (p) { return p.content || ''; });
                        return [4 /*yield*/, business_classifier_1.BusinessClassifier.classifyBusiness(domainId, sampleContent, pages[0] ? pages[0].metadata : undefined)];
                    case 3:
                        classification = _c.sent();
                        // Store classification
                        return [4 /*yield*/, this.supabase
                                .from('business_classifications')
                                .upsert({
                                domain_id: domainId,
                                business_type: classification.primaryType,
                                confidence: classification.confidence,
                                indicators: classification.indicators,
                                entity_terminology: classification.terminology,
                                extraction_config: {
                                    schema: classification.suggestedSchema,
                                    strategy: classification.extractionStrategy
                                }
                            })];
                    case 4:
                        // Store classification
                        _c.sent();
                        this.businessClassification = classification;
                        console.log("Classified as: ".concat(classification.primaryType, " (").concat((classification.confidence * 100).toFixed(0), "% confidence)"));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Extract entities from a page using appropriate strategy
     */
    AdaptiveEntityExtractor.prototype.extractEntities = function (pageId) {
        return __awaiter(this, void 0, void 0, function () {
            var page, extractionPrompt, response, extracted;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.businessClassification) {
                            throw new Error('Must initialize with domain first');
                        }
                        return [4 /*yield*/, this.supabase
                                .from('scraped_pages')
                                .select('*')
                                .eq('id', pageId)
                                .single()];
                    case 1:
                        page = (_c.sent()).data;
                        if (!page) {
                            console.error('Page not found');
                            return [2 /*return*/, null];
                        }
                        extractionPrompt = this.buildExtractionPrompt(page, this.businessClassification);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4-turbo-preview',
                                messages: [
                                    {
                                        role: 'system',
                                        content: "You are a data extraction specialist for ".concat(this.businessClassification.primaryType, " businesses. Extract structured information and return valid JSON only.")
                                    },
                                    {
                                        role: 'user',
                                        content: extractionPrompt
                                    }
                                ],
                                temperature: 0.1,
                                response_format: { type: 'json_object' }
                            })];
                    case 2:
                        response = _c.sent();
                        extracted = JSON.parse(((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '{}');
                        // Store in flexible entity catalog
                        return [4 /*yield*/, this.storeEntity(page, extracted, this.businessClassification)];
                    case 3:
                        // Store in flexible entity catalog
                        _c.sent();
                        return [2 /*return*/, extracted];
                }
            });
        });
    };
    /**
     * Build extraction prompt based on business type
     */
    AdaptiveEntityExtractor.prototype.buildExtractionPrompt = function (page, classification) {
        var _a;
        var schema = classification.suggestedSchema;
        var terminology = classification.terminology;
        var promptTemplate = "\nExtract structured ".concat(terminology.entityName, " information from this webpage.\nReturn JSON with these fields:\n\nCore fields (always include):\n- name: ").concat(terminology.entityName, " name\n- description: Brief description\n- ").concat(schema.identifierField, ": Unique identifier (if found)\n- ").concat(schema.priceField, ": Numeric price/cost (if applicable)\n- ").concat(schema.availabilityField, ": Availability status\n- primary_category: Main category\n- tags: Array of relevant tags\n\n");
        // Add business-specific fields
        switch (classification.primaryType) {
            case business_classifier_1.BusinessType.REAL_ESTATE:
                promptTemplate += "\nReal estate specific:\n- bedrooms: Number of bedrooms\n- bathrooms: Number of bathrooms  \n- square_feet: Size in sqft\n- lot_size: Lot dimensions\n- year_built: Year constructed\n- property_type: House/Condo/Apartment\n- address: Full address\n- amenities: Array of features\n";
                break;
            case business_classifier_1.BusinessType.HEALTHCARE:
                promptTemplate += "\nHealthcare specific:\n- provider_name: Doctor/Provider name\n- specialty: Medical specialty\n- insurance_accepted: Array of accepted insurance\n- appointment_duration: Typical appointment length\n- languages: Languages spoken\n- credentials: Degrees/Certifications\n";
                break;
            case business_classifier_1.BusinessType.EDUCATION:
                promptTemplate += "\nEducation specific:\n- course_code: Course identifier\n- instructor: Teacher/Professor name\n- credit_hours: Number of credits\n- schedule: Days and times\n- prerequisites: Required prior courses\n- enrollment_limit: Max students\n- format: Online/In-person/Hybrid\n";
                break;
            case business_classifier_1.BusinessType.RESTAURANT:
                promptTemplate += "\nRestaurant specific:\n- cuisine_type: Type of cuisine\n- meal_type: Breakfast/Lunch/Dinner\n- dietary_options: Vegan/Vegetarian/Gluten-free\n- ingredients: Key ingredients\n- portion_size: Serving size\n- spice_level: Mild/Medium/Hot\n";
                break;
            default:
                promptTemplate += "\nAdditional fields (extract if relevant):\n- specifications: Object with any technical details\n- features: Array of key features\n- dimensions: Size/measurements if applicable\n";
        }
        promptTemplate += "\n    \nPage URL: ".concat(page.url, "\nPage Title: ").concat(page.title, "\nPage Content: ").concat((_a = page.content) === null || _a === void 0 ? void 0 : _a.substring(0, 4000), "\n\nReturn ONLY valid JSON matching the structure above.");
        return promptTemplate;
    };
    /**
     * Store extracted entity in flexible catalog
     */
    AdaptiveEntityExtractor.prototype.storeEntity = function (page, extracted, classification) {
        return __awaiter(this, void 0, void 0, function () {
            var schema, terminology, entity, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        schema = classification.suggestedSchema;
                        terminology = classification.terminology;
                        entity = {
                            page_id: page.id,
                            domain_id: page.domain_id,
                            entity_type: terminology.entityName,
                            name: extracted.name || 'Unnamed ' + terminology.entityName,
                            description: extracted.description,
                            primary_identifier: extracted[schema.identifierField],
                            price: extracted[schema.priceField],
                            price_unit: extracted.price_unit,
                            is_available: this.parseAvailability(extracted[schema.availabilityField], classification),
                            availability_status: extracted[schema.availabilityField],
                            primary_category: extracted.primary_category,
                            tags: extracted.tags || [],
                            // Store all other fields in attributes
                            attributes: this.extractAttributes(extracted, schema),
                            // Metadata
                            extraction_method: 'gpt4_adaptive',
                            confidence_score: this.calculateConfidence(extracted),
                            raw_data: extracted
                        };
                        return [4 /*yield*/, this.supabase
                                .from('entity_catalog')
                                .upsert(entity)];
                    case 1:
                        error = (_a.sent()).error;
                        if (error) {
                            console.error('Failed to store entity:', error);
                        }
                        else {
                            console.log("Stored ".concat(terminology.entityName, ": ").concat(entity.name));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Parse availability based on business type
     */
    AdaptiveEntityExtractor.prototype.parseAvailability = function (value, classification) {
        if (typeof value === 'boolean')
            return value;
        if (!value)
            return true; // Default to available
        var valueStr = String(value).toLowerCase();
        var unavailableTerms = [
            'sold', 'unavailable', 'booked', 'closed',
            'out of stock', 'not available', 'coming soon'
        ];
        return !unavailableTerms.some(function (term) { return valueStr.includes(term); });
    };
    /**
     * Extract custom attributes based on business type
     */
    AdaptiveEntityExtractor.prototype.extractAttributes = function (data, schema) {
        var attributes = {};
        // Get all fields that aren't core fields
        var coreFields = [
            'name', 'description', 'primary_category', 'tags',
            schema.identifierField, schema.priceField, schema.availabilityField
        ];
        for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (!coreFields.includes(key) && value !== null && value !== undefined) {
                attributes[key] = value;
            }
        }
        return attributes;
    };
    /**
     * Calculate extraction confidence
     */
    AdaptiveEntityExtractor.prototype.calculateConfidence = function (data) {
        var score = 0;
        var fields = 0;
        // Check core fields
        if (data.name) {
            score += 2;
            fields += 2;
        }
        if (data.description) {
            score += 1;
            fields += 1;
        }
        if (data.price || data.fee || data.rate) {
            score += 1;
            fields += 1;
        }
        // Check for any additional data
        var hasAttributes = Object.keys(data).length > 5;
        if (hasAttributes) {
            score += 1;
            fields += 1;
        }
        return fields > 0 ? score / fields : 0;
    };
    /**
     * Batch process entities for a domain
     */
    AdaptiveEntityExtractor.prototype.processDomainsEntities = function (domainId_1) {
        return __awaiter(this, arguments, void 0, function (domainId, limit) {
            var pages, processed, failed, _i, pages_1, page, error_1;
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Initialize for domain first
                    return [4 /*yield*/, this.initializeForDomain(domainId)];
                    case 1:
                        // Initialize for domain first
                        _a.sent();
                        if (!this.businessClassification) {
                            console.error('Failed to classify business');
                            return [2 /*return*/];
                        }
                        console.log("\nProcessing ".concat(this.businessClassification.terminology.entityNamePlural, " for ").concat(this.businessClassification.primaryType, " business"));
                        return [4 /*yield*/, this.supabase
                                .from('scraped_pages')
                                .select('id, url, title')
                                .eq('domain_id', domainId)
                                .limit(limit)];
                    case 2:
                        pages = (_a.sent()).data;
                        if (!pages || pages.length === 0) {
                            console.log('No pages found');
                            return [2 /*return*/];
                        }
                        processed = 0;
                        failed = 0;
                        _i = 0, pages_1 = pages;
                        _a.label = 3;
                    case 3:
                        if (!(_i < pages_1.length)) return [3 /*break*/, 9];
                        page = pages_1[_i];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 7, , 8]);
                        console.log("Extracting from: ".concat(page.title || page.url));
                        return [4 /*yield*/, this.extractEntities(page.id)];
                    case 5:
                        _a.sent();
                        processed++;
                        // Rate limiting
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 6:
                        // Rate limiting
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        console.error("Failed to extract from ".concat(page.id, ":"), error_1);
                        failed++;
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 3];
                    case 9:
                        console.log("\n\u2705 Extraction complete:");
                        console.log("   Processed: ".concat(processed, " ").concat(this.businessClassification.terminology.entityNamePlural));
                        console.log("   Failed: ".concat(failed));
                        return [2 /*return*/];
                }
            });
        });
    };
    return AdaptiveEntityExtractor;
}());
exports.AdaptiveEntityExtractor = AdaptiveEntityExtractor;
