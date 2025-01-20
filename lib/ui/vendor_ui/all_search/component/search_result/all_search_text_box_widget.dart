import 'package:flutter/material.dart';

import '../../../../../config/ps_colors.dart';
import '../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../core/vendor/utils/utils.dart';

class AllSearchTextBoxWidget extends StatefulWidget {
  const AllSearchTextBoxWidget(
      {this.textEditingController,
      this.onFilterChanged,
      this.onSearch,
      this.onClick,
      this.onTextChanged,
      this.onFocusChange,
      this.dropdownKey = 'all',
      this.dropdownValue = 'All',
      this.autofocus = false,
      this.fromHomePage = false});

  final TextEditingController? textEditingController;
  final Function? onFilterChanged;
  final Function? onSearch;
  final Function? onClick;
  final Function? onTextChanged;
  final Function? onFocusChange;
  final String dropdownKey;
  final String dropdownValue;
  final bool autofocus;
  final bool fromHomePage;
  @override
  State<StatefulWidget> createState() => _AllSearchTextBoxWidgetState();
}

class _AllSearchTextBoxWidgetState extends State<AllSearchTextBoxWidget> {
  // Initial Selected Value
  String dropdownvalue = 'All'.tr;
  String dropdownkey = 'all';

  List<String> dropdownValueList = <String>[
    'All'.tr,
    'User'.tr,
    'Manufacturer'.tr,
    'Vehicle'.tr,
  ];

  List<String> dropdownKeyList = <String>[
    PsConst.ALL,
    PsConst.USER,
    PsConst.CATEGORY,
    PsConst.ITEM,
  ];

  @override
  void initState() {
    dropdownkey = widget.dropdownKey;
    dropdownvalue = widget.dropdownValue.tr;
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final Widget _productTextFieldWidget = Flexible(
      child: FocusScope(
        onFocusChange: (bool focus) {
          if (widget.onFocusChange != null) {
            widget.onFocusChange!(focus);
          }
        },
        child: Focus(
          child: TextField(
            readOnly:
                widget.fromHomePage, //not to show keyboard in home dashboard
            autofocus: widget.autofocus,
            keyboardType: TextInputType.text,
            textInputAction: TextInputAction.search,
            maxLines: null,
            controller: widget.textEditingController,
            style: Theme.of(context).textTheme.bodyLarge,
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.only(
                left: PsDimens.space12,
                top: PsDimens.space10,
              ),
              border: InputBorder.none,
              hintText: 'home__bottom_app_bar_search'.tr,
              prefixIcon: InkWell(
                  child: Padding(
                    padding: const EdgeInsets.only(left: 4.0, right: 4),
                    child: Icon(
                      Icons.search,
                      color: Utils.isLightMode(context)
                          ? PsColors.text50
                          : PsColors.achromatic300,
                    ),
                  ),
                  onTap: () {
                    if (widget.onSearch != null) {
                      widget.onSearch!(widget.textEditingController?.text ?? '',
                          dropdownkey, dropdownvalue);
                    }
                  }),
            ),
            onSubmitted: (String value) {
              if (widget.onSearch != null) {
                widget.onSearch!(widget.textEditingController?.text ?? '',
                    dropdownkey, dropdownvalue);
              }
            },
            onChanged: (String value) {
              if (widget.onTextChanged != null) {
                widget.onTextChanged!(value);
              }
            },
            onTap: () {
              if (widget.onClick != null) {
                widget.onClick!(widget.textEditingController?.text ?? '',
                    dropdownkey, dropdownvalue);
              }
            },
          ),
        ),
      ),
    );

    return Column(
      children: <Widget>[
        Container(
          width: double.infinity,
          height: PsDimens.space44,
          decoration: BoxDecoration(
            color: Utils.isLightMode(context)
                ? PsColors.text50
                : PsColors.achromatic800,
            borderRadius: BorderRadius.circular(PsDimens.space8),
          ),
          child: Row(
            children: <Widget>[
              _productTextFieldWidget,
              const Padding(
                padding: EdgeInsets.symmetric(vertical: PsDimens.space10),
                child: VerticalDivider(
                  thickness: 1,
                ),
              ),
              Container(
                margin:
                    const EdgeInsets.symmetric(horizontal: PsDimens.space16),
                width: MediaQuery.of(context).size.width / 7 * 1.5,
                child: Center(
                  child: DropdownButton<String>(
                    isExpanded: true,
                    value: dropdownvalue,
                    underline: const SizedBox(),
                    icon: const Icon(Icons.keyboard_arrow_down),
                    items: dropdownValueList.map((String items) {
                      return DropdownMenuItem<String>(
                        value: items,
                        child: Text(
                          items,
                          maxLines: 1,
                          style:
                              const TextStyle(overflow: TextOverflow.ellipsis),
                        ),
                      );
                    }).toList(),
                    onChanged: (String? newValue) {
                      setState(() {
                        dropdownvalue = newValue!;
                      });
                      final int index = dropdownValueList.indexWhere(
                          (String element) => element == dropdownvalue);
                      dropdownkey = dropdownKeyList[index];
                      if (widget.onFilterChanged != null) {
                        widget.onFilterChanged!(
                            widget.textEditingController?.text ?? '',
                            dropdownkey,
                            dropdownvalue);
                      }
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
